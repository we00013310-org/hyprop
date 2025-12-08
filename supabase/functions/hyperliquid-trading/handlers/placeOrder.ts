import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import type { PlaceOrderAction } from "../types.ts";
import { validateOrderParams } from "../utils/validation.ts";
import { getRealOraclePrice } from "../utils/priceOracle.ts";
import { simulatePosition } from "../services/positionSimulator.ts";
import { simulateFundedPosition } from "../services/fundedPositionSimulator.ts";

export async function handlePlaceOrder(
  supabase: SupabaseClient,
  action: PlaceOrderAction,
  accountId: string,
  isFundedAccount = false
) {
  const { coin, isBuy, size, price, orderType, reduceOnly, tpPrice, slPrice } = action;

  console.log("=== ORDER DETAILS ===");
  console.log("Coin:", coin);
  console.log("Side:", isBuy ? "BUY" : "SELL");
  console.log("Size:", size, typeof size);
  console.log("Price:", price, typeof price);
  console.log("Order Type:", orderType);
  console.log("Reduce Only:", reduceOnly);
  console.log("TP Price:", tpPrice);
  console.log("SL Price:", slPrice);

  validateOrderParams(coin, size, price);

  console.log("=== PHASE 1: SIMULATING POSITION FOR TEST ACCOUNT ===");

  let entryPrice: number;

  if (!isFundedAccount) {
    if (orderType === "market" || !price) {
      entryPrice = await getRealOraclePrice(coin, supabase);
      console.log("Market order: Using oracle price:", entryPrice);
    } else {
      entryPrice = parseFloat(price);
      console.log("Limit order: Using specified price:", entryPrice);
    }

    // Parse TP/SL prices if provided
    const parsedTpPrice = tpPrice ? parseFloat(tpPrice.toString()) : null;
    const parsedSlPrice = slPrice ? parseFloat(slPrice.toString()) : null;

    const simulationResult = await simulatePosition(
      supabase,
      accountId,
      coin,
      isBuy,
      parseFloat(size),
      entryPrice,
      reduceOnly || false,
      parsedTpPrice,
      parsedSlPrice
    );

    return {
      status: "ok",
      response: {
        type: "order",
        data: simulationResult,
      },
      message: "Order simulated successfully (Phase 1)",
    };
  }

  // FUNDED ACCOUNT
  const res = await simulateFundedPosition(
    supabase,
    accountId,
    coin,
    isBuy,
    parseFloat(size),
    reduceOnly || false,
    orderType,
    price as string,
    tpPrice ? tpPrice.toString() : undefined,
    slPrice ? slPrice.toString() : undefined
  );

  console.log("=== SIMULATED ORDER SUCCESS ===");
  // console.log("Result:", JSON.stringify(simulationResult));
  if (res.success) {
    return {
      status: "ok",
      response: {
        type: "order",
      },
      message: "Order created successfully (Phase 1)",
    };
  }

  return {
    status: "failed",
    response: {
      type: "order",
    },
  };
}
