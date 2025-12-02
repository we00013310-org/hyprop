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
    const tpPrice = pos.tp_price ? parseFloat(pos.tp_price.toString()) : null;
    const slPrice = pos.sl_price ? parseFloat(pos.sl_price.toString()) : null;

    const upnl = calculatePnL(entryPrice, currentPrice, size);
    const pnlPercentage = marginUsed > 0 ? (upnl / marginUsed) * 100 : 0;

    // Check TP/SL triggers
    let shouldClose = false;
    let closeReason = "";

    // For long positions (size > 0)
    if (size > 0) {
      if (tpPrice && currentPrice >= tpPrice) {
        shouldClose = true;
        closeReason = "Take Profit hit";
      } else if (slPrice && currentPrice <= slPrice) {
        shouldClose = true;
        closeReason = "Stop Loss hit";
      }
    }
    // For short positions (size < 0)
    else if (size < 0) {
      if (tpPrice && currentPrice <= tpPrice) {
        shouldClose = true;
        closeReason = "Take Profit hit";
      } else if (slPrice && currentPrice >= slPrice) {
        shouldClose = true;
        closeReason = "Stop Loss hit";
      }
    }

    // Check loss limit (existing logic)
    if (!shouldClose && pnlPercentage < AUTO_CLOSE_THRESHOLD_PERCENT) {
      shouldClose = true;
      closeReason = `Loss limit ${pnlPercentage.toFixed(2)}%`;
    }

    await supabase
      .from("test_positions")
      .update({
        upnl,
        last_update_ts: new Date().toISOString(),
      })
      .eq("id", pos.id);

    updated++;

    if (shouldClose) {
      console.log(
        `Auto-closing position ${pos.symbol}: ${closeReason}`
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
