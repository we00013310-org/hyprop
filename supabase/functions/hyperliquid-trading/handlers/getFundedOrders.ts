import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { getFundedOrders } from "../services/fundedAccount.ts";

export async function handleGetFundedOrders(
  supabase: SupabaseClient,
  accountId: string
) {
  console.log("=== GETTING FUNDED ORDERS ===");

  const data = await getFundedOrders(supabase, accountId);

  return data;
}
