import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { Wallet } from "npm:ethers@6";

import { FundedAccount } from "../types.ts";
import { decrypt } from "../../_shared/crypto.ts";
import { getAccountInfo } from "./hyperliquidApi.ts";
import { LEVERAGE, MAX_TRADE } from "../constants.ts";

/**
 * Get wallet and account details for funded account
 */
export async function getFundedAccountWallet(
  supabase: SupabaseClient,
  accountId: string
): Promise<{ account: FundedAccount; wallet: Wallet; accountAddress: string }> {
  // Get funded account with wallet reference
  const { data: account, error: accountError } = await supabase
    .from("funded_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (accountError || !account) {
    throw new Error(`Failed to load funded account: ${accountError?.message}`);
  }

  if (!account.wallet_id) {
    throw new Error("Funded account does not have an associated wallet");
  }

  // Get wallet data
  const { data: walletData, error: walletError } = await supabase
    .from("wallets")
    .select("*")
    .eq("id", account.wallet_id)
    .single();

  if (walletError || !walletData) {
    throw new Error(`Failed to load wallet: ${walletError?.message}`);
  }

  // Decrypt private key
  console.log("Decrypting wallet private key...");
  const decryptedPrivateKey = await decrypt(walletData.key_pk);
  console.log("Private key decrypted successfully");

  // Create wallet instance
  const wallet = new Wallet(decryptedPrivateKey);
  const walletAddress = wallet.address;

  console.log("Using wallet address:", walletAddress);

  return { account, wallet, accountAddress: walletData.account_address };
}

export async function getFundedAccount(
  supabase: SupabaseClient,
  fundedAccountId: string
): Promise<FundedAccount> {
  const { data: fundedAccount } = await supabase
    .from("funded_accounts")
    .select("*")
    .eq("id", fundedAccountId)
    .single();

  if (!fundedAccount) {
    throw new Error("Funded account not found");
  }

  return fundedAccount;
}

export async function getFundedAccountInfo(
  supabase: SupabaseClient,
  fundedAccountId: string
) {
  const { accountAddress, account, wallet } = await getFundedAccountWallet(
    supabase,
    fundedAccountId
  );

  const data = await getAccountInfo(accountAddress);

  const noUse = account.account_size - MAX_TRADE;
  const used = +data.crossMarginSummary.totalMarginUsed * LEVERAGE;
  const virtualBalance =
    +data.crossMarginSummary.accountValue * LEVERAGE + noUse;
  const currentDD = Math.max(
    (account.high_water_mark - virtualBalance) / account.high_water_mark,
    0
  );
  const available = +data.crossMarginSummary.accountValue * LEVERAGE - used;

  return {
    ...account,
    virtual_balance: virtualBalance,
    used,
    available,
    wallet,
    assetPositions: data.assetPositions,
    oldVirtualBalance: account.virtual_balance,
    currentDD,
  };
}
