import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { checkTestStatus as checkTestStatusService } from "../services/testEvaluator.ts";

export async function handleCheckTestStatus(
  supabase: SupabaseClient,
  accountId: string
): Promise<any> {
  return await checkTestStatusService(supabase, accountId);
}
