import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { getFundedAccountInfo } from "./fundedAccount.ts";
import { createOrder, createOrderWithTpSl } from "./hyperliquidApi.ts";

export async function simulateFundedPosition(
  supabase: SupabaseClient,
  fundedAccountId: string,
  coin: string,
  isBuy: boolean,
  size: number,
  reduceOnly: boolean,
  orderType: "market" | "limit",
  entryPrice: string,
  tpPrice?: string,
  slPrice?: string
) {
  try {
    console.log("=== SIMULATING POSITION FOR FUNDED ACCOUNT ===");
    console.log("Funded Account ID:", fundedAccountId);
    console.log("Coin:", coin);
    console.log("Side:", isBuy ? "BUY" : "SELL");
    console.log("Size:", size);
    console.log("Entry Price:", entryPrice);
    console.log("Reduce Only:", reduceOnly);
    console.log("TP Price:", tpPrice);
    console.log("SL Price:", slPrice);

    const { wallet, available } = await getFundedAccountInfo(
      supabase,
      fundedAccountId
    );

    if (!available) {
      return {
        success: false,
      };
    }

    await createOrderWithTpSl(wallet, {
      coin,
      isBuy,
      size: size.toString(),
      price: entryPrice,
      orderType,
      reduceOnly,
      tpPrice,
      slPrice,
    });

    return {
      success: true,
    };
  } catch (err) {
    console.log("ERROR AHIHI", err);
    return {
      success: false,
    };
  }
}
