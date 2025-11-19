import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { AUTO_CLOSE_THRESHOLD_PERCENT, TAKER_FEE_RATE } from "../constants.ts";
import { getRealOraclePrice, calculatePnL } from "../utils/priceOracle.ts";
import type { TestAccount, TestPosition } from "../types.ts";
import { getTestAccount } from "../services/accountCreator.ts";

async function autoClosePosition(
  supabase: SupabaseClient,
  pos: TestPosition,
  currentPrice: number,
  testAccount: TestAccount,
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

  await supabase.from("test_positions").delete().eq("id", pos.id);

  const newBalance = testAccount.virtual_balance + realizedPnL;
  await supabase
    .from("test_accounts")
    .update({
      virtual_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId);
}

export async function handleUpdatePositionPnL(
  supabase: SupabaseClient,
  accountId: string
) {
  console.log("=== UPDATING POSITION PNL ===");

  const { data: positions } = await supabase
    .from("test_positions")
    .select("*")
    .eq("test_account_id", accountId);

  if (!positions || positions.length === 0) {
    return { updated: 0, closed: 0 };
  }

  const testAccount = await getTestAccount(supabase, accountId);

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
      .from("test_positions")
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
        testAccount,
        accountId
      );

      closed++;
    }
  }

  return { updated, closed };
}
