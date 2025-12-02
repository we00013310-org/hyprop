import { useEffect, useRef, useCallback } from "react";
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

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({
            queryKey: ["test-orders", testAccountId],
          });
          queryClient.invalidateQueries({
            queryKey: ["test-positions"],
          });
          queryClient.invalidateQueries({
            queryKey: ["test-account"],
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
    [testAccountId, walletAddress, currentPrice, queryClient]
  );

  const checkAndFillOrders = useCallback(async () => {
    if (!testAccountId || !currentPrice || currentPrice <= 0) {
      return;
    }

    // Skip if price hasn't changed significantly (within 0.01%)
    if (
      lastPriceRef.current > 0 &&
      Math.abs(currentPrice - lastPriceRef.current) / lastPriceRef.current <
        0.0001
    ) {
      return;
    }
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

      // Check each order against the current price
      for (const order of openOrders) {
        const orderPrice = parseFloat(order.price.toString());
        const shouldFill = shouldFillOrder(order.side, orderPrice, currentPrice);

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
 * - Buy orders: filled when current price <= order price (price dropped to limit)
 * - Sell orders: filled when current price >= order price (price rose to limit)
 */
function shouldFillOrder(
  side: string,
  orderPrice: number,
  currentPrice: number
): boolean {
  if (side === "buy") {
    // Buy limit order: fill when price drops to or below the limit price
    return currentPrice <= orderPrice;
  } else if (side === "sell") {
    // Sell limit order: fill when price rises to or above the limit price
    return currentPrice >= orderPrice;
  }
  return false;
}
