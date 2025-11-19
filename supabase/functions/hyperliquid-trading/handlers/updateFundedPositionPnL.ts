import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { AUTO_CLOSE_THRESHOLD_PERCENT, TAKER_FEE_RATE } from "../constants.ts";
import { getRealOraclePrice, calculatePnL } from "../utils/priceOracle.ts";
import type { FundedAccount } from "../types.ts";

// Type for positions table (funded accounts use 'positions' not 'test_positions')
interface Position {
  id: string;
  account_id: string;
  symbol: string;
  side: string;
  size: number;
  avg_entry: number;
  margin_used: number;
  upnl: number;
  rpnl: number;
  fees_accrued: number;
  last_update_ts: string;
  created_at: string;
}

async function getFundedAccount(
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

async function autoClosePosition(
  supabase: SupabaseClient,
  pos: Position,
  currentPrice: number,
  fundedAccount: FundedAccount,
  accountId: string
): Promise<void> {
  const size = parseFloat(pos.size.toString());
  const entryPrice = parseFloat(pos.avg_entry.toString());
  const closeSize = Math.abs(size);

  let realizedPnL = 0;
  if (pos.side === "long") {
    realizedPnL = (currentPrice - entryPrice) * closeSize;
  } else {
    realizedPnL = (entryPrice - currentPrice) * closeSize;
  }

  const tradingFee = closeSize * currentPrice * TAKER_FEE_RATE;
  realizedPnL -= tradingFee;

  await supabase.from("positions").delete().eq("id", pos.id);

  const newBalance = fundedAccount.virtual_balance + realizedPnL;
  await supabase
    .from("funded_accounts")
    .update({
      virtual_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId);
}

export async function handleUpdateFundedPositionPnL(
  supabase: SupabaseClient,
  accountId: string
) {
  console.log("=== UPDATING FUNDED POSITION PNL ===");

  const { data: positions } = await supabase
    .from("positions")
    .select("*")
    .eq("account_id", accountId);

  if (!positions || positions.length === 0) {
    return { updated: 0, closed: 0 };
  }

  const fundedAccount = await getFundedAccount(supabase, accountId);

  let updated = 0;
  let closed = 0;

  for (const pos of positions) {
    const currentPrice = await getRealOraclePrice(pos.symbol, supabase);
    const size = parseFloat(pos.size.toString());
    const entryPrice = parseFloat(pos.avg_entry.toString());
    const marginUsed = parseFloat(pos.margin_used.toString());

    const upnl = calculatePnL(entryPrice, currentPrice, size);
    const pnlPercentage = marginUsed > 0 ? (upnl / marginUsed) * 100 : 0;

    await supabase
      .from("positions")
      .update({
        upnl,
        last_update_ts: new Date().toISOString(),
      })
      .eq("id", pos.id);

    updated++;

    if (pnlPercentage < AUTO_CLOSE_THRESHOLD_PERCENT) {
      console.log(
        `Auto-closing position ${pos.symbol}: Loss ${pnlPercentage.toFixed(2)}%`
      );

      await autoClosePosition(
        supabase,
        pos,
        currentPrice,
        fundedAccount,
        accountId
      );

      closed++;
    }
  }

  return { updated, closed };
}
