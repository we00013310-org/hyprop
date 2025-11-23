import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { checkTestStatus as checkTestStatusService } from "../services/testEvaluator.ts";

export function handleCheckTestStatus(
  supabase: SupabaseClient,
  accountId: string
) {
  return checkTestStatusService(supabase, accountId);
}
