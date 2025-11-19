import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { checkFundedStatus as checkFundedStatusService } from "../services/fundedEvaluator.ts";

export async function handleCheckFundedStatus(
  supabase: SupabaseClient,
  accountId: string
): Promise<any> {
  return await checkFundedStatusService(supabase, accountId);
}
