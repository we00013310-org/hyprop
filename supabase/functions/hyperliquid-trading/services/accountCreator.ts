import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { TestAccount } from "../types.ts";

export async function createFundedAccount(
  testAccount: TestAccount,
  supabase: SupabaseClient
): Promise<void> {
  console.log("=== CREATING FUNDED ACCOUNT ===");
  console.log(
    "Test account passed, creating funded account for user:",
    testAccount.user_id
  );

  const profit = testAccount.virtual_balance - testAccount.account_size;
  const profitPercent = (profit / testAccount.account_size) * 100;

  const fundedAccountSize = testAccount.account_size;
  const userLeverage = 20;
  const effectiveLeverage = 419;
  const maxDrawdown = testAccount.dd_max;
  const dailyDrawdown = testAccount.dd_daily;
  const maxNotional = fundedAccountSize * userLeverage;
  const initialMargin = fundedAccountSize * 0.2;
  const maintenanceMargin = fundedAccountSize * 0.1;

  try {
    const { data: fundedAccount, error: fundedError } = await supabase
      .from("funded_accounts")
      .insert({
        user_id: testAccount.user_id,
        test_account_id: testAccount.id,
        primary_symbol: "BTC-PERP",
        pair_mode: "single",
        l_user: userLeverage,
        n_max: maxNotional,
        l_effective: effectiveLeverage,
        im_required: initialMargin,
        maintenance_margin: maintenanceMargin,
        balance_actual: fundedAccountSize,
        dd_max: maxDrawdown,
        dd_daily: dailyDrawdown,
        e_start: fundedAccountSize,
        e_day_start: fundedAccountSize,
        high_water_mark: fundedAccountSize,
        status: "active",
        hl_subaccount_id: null,
        hl_builder_code: testAccount.hl_builder_code || null,
      })
      .select()
      .single();

    if (fundedError) {
      console.error("Failed to create funded account:", fundedError);
      throw new Error(
        `Failed to create funded account: ${fundedError.message}`
      );
    }

    console.log("=== FUNDED ACCOUNT CREATED SUCCESSFULLY ===");
    console.log("Funded Account ID:", fundedAccount.id);
    console.log("Funded Account Size:", fundedAccountSize, "USDC");
    console.log("Max Notional:", maxNotional, "USDC");
    console.log("User Leverage:", userLeverage, "x");
    console.log("Max Drawdown:", maxDrawdown, "%");

    await supabase.from("events").insert({
      user_id: testAccount.user_id,
      account_id: fundedAccount.id,
      type: "test_account_converted",
      payload: {
        test_account_id: testAccount.id,
        test_profit: profit,
        test_profit_percent: profitPercent,
        funded_account_size: fundedAccountSize,
        conversion_timestamp: new Date().toISOString(),
      },
    });
  } catch (conversionError: any) {
    console.error("=== FUNDED ACCOUNT CONVERSION FAILED ===");
    console.error("Conversion error:", conversionError);

    await supabase.from("events").insert({
      user_id: testAccount.user_id,
      type: "test_account_conversion_failed",
      payload: {
        test_account_id: testAccount.id,
        test_profit: profit,
        test_profit_percent: profitPercent,
        error_message: conversionError.message,
        conversion_timestamp: new Date().toISOString(),
      },
    });

    console.warn(
      "Test passed but funded account creation failed. User can contact support."
    );
  }
}

export async function getTestAccount(
  supabase: SupabaseClient,
  accountId: string
): Promise<TestAccount> {
  const { data: testAccount } = await supabase
    .from("test_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (!testAccount) {
    throw new Error("Test account not found");
  }

  return testAccount;
}
