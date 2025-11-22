import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { getFundedAccountInfo } from "./fundedAccount.ts";
import { createOrder } from "./hyperliquidApi.ts";

export async function simulateFundedPosition(
  supabase: SupabaseClient,
  fundedAccountId: string,
  coin: string,
  isBuy: boolean,
  size: number,
  reduceOnly: boolean,
  orderType: "market" | "limit",
  entryPrice: string
) {
  try {
    console.log("=== SIMULATING POSITION FOR FUNDED ACCOUNT ===");
    console.log("Funded Account ID:", fundedAccountId);
    console.log("Coin:", coin);
    console.log("Side:", isBuy ? "BUY" : "SELL");
    console.log("Size:", size);
    console.log("Entry Price:", entryPrice);
    console.log("Reduce Only:", reduceOnly);

    const { wallet, available } = await getFundedAccountInfo(
      supabase,
      fundedAccountId
    );

    if (!available) {
      return {
        success: false,
      };
    }

    await createOrder(wallet, {
      coin,
      isBuy,
      size: size.toString(),
      price: entryPrice,
      orderType,
      reduceOnly,
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
