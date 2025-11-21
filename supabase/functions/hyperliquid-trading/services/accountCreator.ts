/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import type { TestAccount } from "../types.ts";
import {
  CHECKPOINT_INTERVAL_HOURS,
  CHECKPOINT_PROFIT_TARGET,
  NUM_CHECKPOINTS,
} from "../constants.ts";
import { decrypt } from "../../_shared/crypto.ts";

export async function createFundedAccount(
  testAccount: TestAccount,
  supabase: SupabaseClient
): Promise<void> {
  console.log("=== CREATING FUNDED ACCOUNT ===");
  console.log(
    "Test account passed, creating funded account for user:",
    testAccount.user_id
  );

  try {
    // First, get one available wallet
    const { data: availableWallet, error: selectError } = await supabase
      .from("wallets")
      .select("*")
      .eq("status", 0)
      .limit(1)
      .single();

    if (selectError || !availableWallet) {
      console.error("Failed to find available wallet:", selectError);
      throw new Error(
        `Failed to find available wallet: ${selectError?.message}`
      );
    }

    // Then update only that specific wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .update({ status: 1 })
      .eq("account_address", availableWallet.account_address)
      .select()
      .single();

    if (walletError || !wallet) {
      console.error("Failed to update wallet:", walletError);
      throw new Error(`Failed to update wallet: ${walletError?.message}`);
    }

    // Decrypt the private key for use
    console.log("Decrypting wallet private key...");
    const decryptedPrivateKey = await decrypt(wallet.key_pk);
    console.log("Private key decrypted successfully");

    // TODO: In Phase 2, use decryptedPrivateKey to initialize Hyperliquid trading client
    // For now, we just store the wallet address reference

    const { data: fundedAccount, error: fundedError } = await supabase
      .from("funded_accounts")
      .insert({
        user_id: testAccount.user_id,
        account_size: testAccount.account_size,
        account_mode: testAccount.account_mode,
        fee_paid: testAccount.fee_paid,
        virtual_balance: testAccount.account_size,
        dd_max: testAccount.dd_max,
        dd_daily: testAccount.dd_daily,
        profit_target: testAccount.profit_target,
        high_water_mark: testAccount.account_size,
        num_checkpoints: NUM_CHECKPOINTS,
        checkpoint_interval_hours: CHECKPOINT_INTERVAL_HOURS,
        checkpoint_profit_target_percent: CHECKPOINT_PROFIT_TARGET,
        test_account_id: testAccount.id,
        status: "active",
        wallet_id: wallet.id,
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

    await supabase.from("events").insert({
      user_id: testAccount.user_id,
      account_id: fundedAccount.id,
      type: "test_account_converted",
      payload: {
        test_account_id: testAccount.id,
        funded_account_id: fundedAccount.id,
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
