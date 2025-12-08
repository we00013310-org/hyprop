import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { getFundedAccountWallet } from "../services/fundedAccount.ts";
import { cancelAllOrders, cancelOrder } from "../services/hyperliquidApi.ts";

export async function handleCancelOrder(
  supabase: SupabaseClient,
  accountId: string,
  coin: string,
  orderId: number
) {
  const { wallet } = await getFundedAccountWallet(supabase, accountId);

  await cancelOrder(wallet, coin, orderId);

  return {
    success: true,
    message: "Order cancelled successfully",
  };
}

export async function handleCancelAllOrders(
  supabase: SupabaseClient,
  accountId: string
) {
  console.log("START CANCEL ALL ORDERS");
  const { wallet, accountAddress } = await getFundedAccountWallet(
    supabase,
    accountId
  );

  await cancelAllOrders(accountAddress, wallet);

  return {
    success: true,
    message: "All orders cancelled successfully",
  };
}
