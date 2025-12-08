import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { failAccount } from "../services/fundedAccount.ts";

export async function handleFailFundedAccount(
  supabase: SupabaseClient,
  accountId: string
) {
  await failAccount(supabase, accountId);

  return {
    success: true,
    message: `Account ${accountId} has been failed and all positions closed`,
  };
}
