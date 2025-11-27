import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { Wallet } from "npm:ethers@6";

import { FundedAccount } from "../types.ts";
import { decrypt } from "../../_shared/crypto.ts";
import { getAccountInfo, closePosition } from "./hyperliquidApi.ts";
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
    accountAddress,
    assetPositions: data.assetPositions,
    oldVirtualBalance: account.virtual_balance,
    currentDD,
  };
}

export async function failAccount(
  supabase: SupabaseClient,
  accountId: string
): Promise<void> {
  try {
    console.log(`Failing account ${accountId} - closing all positions first`);

    // Get account wallet and address
    const { wallet, accountAddress } = await getFundedAccountWallet(
      supabase,
      accountId
    );

    // Get current positions from Hyperliquid
    const accountInfo = await getAccountInfo(accountAddress);

    // Close all open positions
    if (accountInfo.assetPositions && accountInfo.assetPositions.length > 0) {
      console.log(
        `Found ${accountInfo.assetPositions.length} positions to close`
      );

      for (const assetPosition of accountInfo.assetPositions) {
        const position = assetPosition.position;

        // Skip if position size is 0
        const size = Math.abs(parseFloat(position.szi));
        if (size === 0) {
          console.log(`Skipping ${position.coin} - no position`);
          continue;
        }

        const isLong = parseFloat(position.szi) > 0;

        console.log(
          `Closing ${position.coin} position: ${
            isLong ? "LONG" : "SHORT"
          } ${size}`
        );

        try {
          await closePosition(wallet, position.coin, size.toString(), isLong);
          console.log(`Successfully closed ${position.coin} position`);
        } catch (error) {
          console.error(`Failed to close ${position.coin} position:`, error);
          // Continue closing other positions even if one fails
        }
      }
    } else {
      console.log("No open positions to close");
    }
  } catch (error) {
    console.error("Error closing positions during account failure:", error);
    // Continue with failing the account even if position closure fails
  }

  // Update account status to failed
  await supabase
    .from("funded_accounts")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId);

  console.log(`Account ${accountId} marked as failed`);
}
