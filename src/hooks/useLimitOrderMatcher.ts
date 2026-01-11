import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { HyperliquidTrading } from "@/lib/hyperliquidTrading";
import { TestOrder } from "@/types";

interface UseLimitOrderMatcherOptions {
  testAccountId: string;
  currentPrice: number;
  enabled?: boolean;
}

/**
 * Hook that monitors the current price and matches open limit orders.
 * When a limit order's trigger conditions are met:
 * - Buy order: current price <= order price
 * - Sell order: current price >= order price
 * The order is filled by creating a simulated position.
 */
export function useLimitOrderMatcher({
  testAccountId,
  currentPrice,
  enabled = true,
}: UseLimitOrderMatcherOptions) {
  const { walletAddress } = useAuth();
  const queryClient = useQueryClient();
  const processingOrdersRef = useRef<Set<string>>(new Set());
  const lastPriceRef = useRef<number>(0);

  /**
   * Activates child TP/SL orders when their parent entry order fills.
   * Returns a list of orders that should be filled immediately.
   */
  const activateChildOrders = useCallback(
    async (parentOrderId: string, currentPrice: number): Promise<TestOrder[]> => {
      try {
        // Find all TP/SL orders linked to this parent
        const { data: childOrders, error: fetchError } = await supabase
          .from("test_orders")
          .select("*")
          .eq("parent_order_id", parentOrderId)
          .eq("is_active", false)
          .eq("status", "open")
          .in("order_subtype", ["take_profit", "stop_loss"]);

        if (fetchError || !childOrders || childOrders.length === 0) {
          return [];
        }

        console.log(`Activating ${childOrders.length} TP/SL orders for parent ${parentOrderId}`);

        // Check if any should execute immediately
        const toExecuteImmediately: TestOrder[] = [];
        const toActivate: string[] = [];

        for (const order of childOrders) {
          const orderPrice = parseFloat(order.price.toString());

          // Use the same logic as shouldFillOrder
          let shouldExecuteNow = false;
          if (order.order_subtype === 'stop_loss') {
            // Stop loss: opposite logic
            shouldExecuteNow =
              (order.side === "buy" && currentPrice >= orderPrice) ||
              (order.side === "sell" && currentPrice <= orderPrice);
          } else {
            // Take profit: regular limit order logic
            shouldExecuteNow =
              (order.side === "buy" && currentPrice <= orderPrice) ||
              (order.side === "sell" && currentPrice >= orderPrice);
          }

          if (shouldExecuteNow) {
            toExecuteImmediately.push(order);
            console.log(`Order ${order.id} (${order.order_subtype}) will execute immediately (price already reached)`);
          } else {
            toActivate.push(order.id);
          }
        }

        // Activate orders that should wait for price
        if (toActivate.length > 0) {
          const { error: updateError } = await supabase
            .from("test_orders")
            .update({ is_active: true })
            .in("id", toActivate);

          if (updateError) {
            console.error("Failed to activate TP/SL orders:", updateError);
          } else {
            console.log(`Activated ${toActivate.length} TP/SL orders`);
          }
        }

        // Activate orders that will execute immediately
        if (toExecuteImmediately.length > 0) {
          const idsToActivate = toExecuteImmediately.map(o => o.id);
          await supabase
            .from("test_orders")
            .update({ is_active: true })
            .in("id", idsToActivate);
        }

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ["test-orders", testAccountId] });

        return toExecuteImmediately;
      } catch (error) {
        console.error("Error activating child TP/SL orders:", error);
        return [];
      }
    },
    [testAccountId, queryClient]
  );

  const fillOrder = useCallback(
    async (order: TestOrder) => {
      if (!walletAddress) {
        console.error("Cannot fill order: wallet not connected");
        return false;
      }

      // Prevent duplicate processing
      if (processingOrdersRef.current.has(order.id)) {
        return false;
      }

      processingOrdersRef.current.add(order.id);

      try {
        console.log(`=== FILLING LIMIT ORDER ===`);
        console.log(`Order ID: ${order.id}`);
        console.log(`Symbol: ${order.symbol}`);
        console.log(`Side: ${order.side}`);
        console.log(`Size: ${order.size}`);
        console.log(`Order Price: ${order.price}`);
        console.log(`Current Price: ${currentPrice}`);

        // Create position using the existing trading infrastructure
        const trading = new HyperliquidTrading(
          testAccountId,
          walletAddress,
          false // test account
        );

        const isBuy = order.side === "buy";

        // Place the order at the limit price (as specified in the order)
        const result = await trading.placeOrder(
          order.symbol,
          isBuy,
          order.size,
          order.price, // Use the limit order price
          "limit", // Order type
          order.reduce_only
        );

        console.log("Position creation result:", result);

        if (result && result.status === "ok") {
          // Mark the order as filled
          const { error: updateError } = await supabase
            .from("test_orders")
            .update({
              status: "filled",
              filled_size: order.size,
              filled_price: order.price,
              filled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id)
            .eq("status", "open");

          if (updateError) {
            console.error("Failed to update order status:", updateError);
            return false;
          }

          console.log(`Order ${order.id} filled successfully`);

          // Activate child TP/SL orders if this is a regular entry order
          if (order.order_subtype === 'regular') {
            console.log(`Order ${order.id} is a regular order, checking for child TP/SL orders...`);
            const ordersToFillImmediately = await activateChildOrders(order.id, currentPrice);

            // Fill orders that are already at target price
            for (const childOrder of ordersToFillImmediately) {
              console.log(`Filling child order ${childOrder.id} immediately`);
              await fillOrder(childOrder);
            }
          }

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({
            queryKey: ["test-orders", testAccountId],
          });
          queryClient.invalidateQueries({
            queryKey: ["test-positions", testAccountId],
          });
          queryClient.invalidateQueries({
            queryKey: ["test-account", testAccountId],
          });

          return true;
        } else {
          console.error("Failed to create position:", result);
          return false;
        }
      } catch (error) {
        console.error(`Failed to fill order ${order.id}:`, error);
        return false;
      } finally {
        processingOrdersRef.current.delete(order.id);
      }
    },
    [testAccountId, walletAddress, currentPrice, queryClient, activateChildOrders]
  );

  const checkAndFillOrders = useCallback(async () => {
    if (!testAccountId || !currentPrice || currentPrice <= 0) {
      return;
    }

    // Skip if price hasn't changed significantly (within 0.5%)
    // Use a larger threshold to account for small fluctuations but still
    // trigger on meaningful price changes (including demo offset changes)
    const priceChangePercent =
      lastPriceRef.current > 0
        ? Math.abs(currentPrice - lastPriceRef.current) / lastPriceRef.current
        : 1; // Force check on first run

    console.log(
      `Price changed from ${lastPriceRef.current} to ${currentPrice} (${(
        priceChangePercent * 100
      ).toFixed(2)}%), checking orders...`
    );
    lastPriceRef.current = currentPrice;

    try {
      // Fetch all open orders for this account
      const { data: openOrders, error } = await supabase
        .from("test_orders")
        .select("*")
        .eq("test_account_id", testAccountId)
        .eq("status", "open")
        .order("created_at", { ascending: true }); // Process oldest orders first

      if (error) {
        console.error("Failed to fetch open orders:", error);
        return;
      }

      if (!openOrders || openOrders.length === 0) {
        return;
      }

      console.log(
        `Checking ${openOrders.length} open orders against current price: $${currentPrice}`
      );

      // Check each order against the current price
      for (const order of openOrders) {
        const orderPrice = parseFloat(order.price.toString());
        const shouldFill = shouldFillOrder(order, currentPrice);  // Pass full order

        console.log(
          `Order ${order.id}: ${order.side} @ $${orderPrice}, current: $${currentPrice}, shouldFill: ${shouldFill}`
        );

        if (shouldFill) {
          console.log(
            `Order ${order.id} triggered: ${order.side} @ ${orderPrice}, current price: ${currentPrice}`
          );
          await fillOrder(order);
        }
      }
    } catch (error) {
      console.error("Error checking limit orders:", error);
    }
  }, [testAccountId, currentPrice, fillOrder]);

  // Run the check whenever price changes
  useEffect(() => {
    if (!enabled || !currentPrice || currentPrice <= 0) {
      return;
    }

    checkAndFillOrders();
  }, [enabled, currentPrice, checkAndFillOrders]);

  return {
    checkAndFillOrders,
  };
}

/**
 * Determines if an order should be filled based on the current price.
 * - Skips inactive TP/SL orders (waiting for parent entry to fill)
 * - Regular limit orders: Buy when price <= limit, Sell when price >= limit
 * - Take Profit orders: Same as limit orders (favorable price movement)
 * - Stop Loss orders: OPPOSITE logic (unfavorable price movement triggers stop)
 */
function shouldFillOrder(
  order: TestOrder,  // Pass full order object to check is_active and order_subtype
  currentPrice: number
): boolean {
  // Skip inactive TP/SL orders - they haven't been activated yet
  if (!order.is_active &&
      (order.order_subtype === 'take_profit' || order.order_subtype === 'stop_loss')) {
    return false;
  }

  const side = order.side;
  const orderPrice = parseFloat(order.price.toString());

  // Stop Loss orders use opposite logic from limit orders
  if (order.order_subtype === 'stop_loss') {
    if (side === "buy") {
      // Stop loss buy (for short position): trigger when price RISES to stop level
      return currentPrice >= orderPrice;
    } else if (side === "sell") {
      // Stop loss sell (for long position): trigger when price FALLS to stop level
      return currentPrice <= orderPrice;
    }
  }

  // Regular limit orders and Take Profit orders (same logic)
  if (side === "buy") {
    // Buy limit/TP: fill when price drops to or below the limit price
    return currentPrice <= orderPrice;
  } else if (side === "sell") {
    // Sell limit/TP: fill when price rises to or above the limit price
    return currentPrice >= orderPrice;
  }

  return false;
}
