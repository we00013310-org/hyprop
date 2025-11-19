import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { TAKER_FEE_RATE, DEFAULT_LEVERAGE } from "../constants.ts";
import type { FundedAccount } from "../types.ts";
import { getRealOraclePrice, calculatePnL } from "../utils/priceOracle.ts";

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

async function getExistingPosition(
  supabase: SupabaseClient,
  fundedAccountId: string,
  coin: string
): Promise<Position | null> {
  const { data: existingPosition } = await supabase
    .from("positions")
    .select("*")
    .eq("account_id", fundedAccountId)
    .eq("symbol", coin)
    .maybeSingle();

  return existingPosition;
}

function calculateNewSize(
  existingSize: number,
  existingSide: string,
  size: number,
  isBuy: boolean,
  isClosing: boolean
): number {
  if (isClosing) {
    if (existingSide === "long") {
      return existingSize - size;
    } else {
      return existingSize + size;
    }
  }

  if (existingSide === "long" && isBuy) {
    return existingSize + size;
  } else if (existingSide === "short" && !isBuy) {
    return existingSize - size;
  } else {
    return isBuy ? existingSize + size : existingSize - size;
  }
}

function calculateRealizedPnL(
  existingSide: string,
  existingEntry: number,
  closePrice: number,
  closeSize: number,
  tradingFee: number
): number {
  let realizedPnL = 0;

  if (existingSide === "long") {
    realizedPnL = (closePrice - existingEntry) * closeSize;
  } else {
    realizedPnL = (existingEntry - closePrice) * closeSize;
  }

  return realizedPnL - tradingFee;
}

async function closePosition(
  supabase: SupabaseClient,
  existingPosition: Position,
  entryPrice: number,
  size: number,
  tradingFee: number
): Promise<{ position: Position | null; realizedPnL: number }> {
  const existingSize = parseFloat(existingPosition.size.toString());
  const existingEntry = parseFloat(existingPosition.avg_entry.toString());
  const existingSide = existingPosition.side;

  const newSize = calculateNewSize(
    existingSize,
    existingSide,
    size,
    false,
    true
  );

  const closeSize = Math.min(Math.abs(existingSize), size);
  const realizedPnL = calculateRealizedPnL(
    existingSide,
    existingEntry,
    entryPrice,
    closeSize,
    tradingFee
  );

  if (Math.abs(newSize) < 0.0001) {
    await supabase.from("positions").delete().eq("id", existingPosition.id);

    return { position: null, realizedPnL };
  }

  const newSide = newSize > 0 ? "long" : "short";
  const currentOraclePrice = await getRealOraclePrice(
    existingPosition.symbol,
    supabase
  );
  const newUpnl = calculatePnL(entryPrice, currentOraclePrice, newSize);

  await supabase
    .from("positions")
    .update({
      size: newSize,
      side: newSide,
      avg_entry: entryPrice,
      margin_used: (Math.abs(newSize) * entryPrice) / DEFAULT_LEVERAGE,
      upnl: newUpnl,
      rpnl: (parseFloat(existingPosition.rpnl.toString()) || 0) + realizedPnL,
      fees_accrued:
        (parseFloat(existingPosition.fees_accrued.toString()) || 0) +
        tradingFee,
      last_update_ts: new Date().toISOString(),
    })
    .eq("id", existingPosition.id);

  const { data: updated } = await supabase
    .from("positions")
    .select("*")
    .eq("id", existingPosition.id)
    .single();

  return { position: updated, realizedPnL };
}

async function addToPosition(
  supabase: SupabaseClient,
  existingPosition: Position,
  size: number,
  entryPrice: number,
  isBuy: boolean,
  tradingFee: number
): Promise<Position> {
  const existingSize = parseFloat(existingPosition.size.toString());
  const existingEntry = parseFloat(existingPosition.avg_entry.toString());
  const existingSide = existingPosition.side;

  const newSize = calculateNewSize(
    existingSize,
    existingSide,
    size,
    isBuy,
    false
  );

  const totalNotional =
    Math.abs(existingSize) * existingEntry + size * entryPrice;
  const newEntry = totalNotional / Math.abs(newSize);

  const currentOraclePrice = await getRealOraclePrice(
    existingPosition.symbol,
    supabase
  );
  const newUpnl = calculatePnL(newEntry, currentOraclePrice, newSize);

  await supabase
    .from("positions")
    .update({
      size: newSize,
      avg_entry: newEntry,
      margin_used: (Math.abs(newSize) * newEntry) / DEFAULT_LEVERAGE,
      upnl: newUpnl,
      fees_accrued:
        (parseFloat(existingPosition.fees_accrued.toString()) || 0) +
        tradingFee,
      last_update_ts: new Date().toISOString(),
    })
    .eq("id", existingPosition.id);

  const { data: updated } = await supabase
    .from("positions")
    .select("*")
    .eq("id", existingPosition.id)
    .single();

  return updated;
}

async function openNewPosition(
  supabase: SupabaseClient,
  fundedAccountId: string,
  coin: string,
  isBuy: boolean,
  size: number,
  entryPrice: number,
  tradingFee: number
): Promise<Position> {
  const side = isBuy ? "long" : "short";
  const signedSize = isBuy ? size : -size;
  const marginUsed = (size * entryPrice) / DEFAULT_LEVERAGE;

  const currentOraclePrice = await getRealOraclePrice(coin, supabase);
  const initialUpnl = calculatePnL(entryPrice, currentOraclePrice, signedSize);

  const { data: newPos } = await supabase
    .from("positions")
    .insert({
      account_id: fundedAccountId,
      symbol: coin,
      side,
      size: signedSize,
      avg_entry: entryPrice,
      margin_used: marginUsed,
      upnl: initialUpnl,
      rpnl: 0,
      fees_accrued: tradingFee,
    })
    .select()
    .single();

  return newPos;
}

async function updateFundedAccountBalance(
  supabase: SupabaseClient,
  fundedAccount: FundedAccount,
  fundedAccountId: string,
  realizedPnL: number,
  tradingFee: number,
  positionClosed: boolean
): Promise<number> {
  let newBalance: number;

  if (positionClosed) {
    newBalance = fundedAccount.virtual_balance + realizedPnL;
  } else {
    newBalance = fundedAccount.virtual_balance + realizedPnL - tradingFee;
  }

  const newHighWaterMark = Math.max(
    fundedAccount.high_water_mark || fundedAccount.account_size,
    newBalance
  );

  await supabase
    .from("funded_accounts")
    .update({
      virtual_balance: newBalance,
      high_water_mark: newHighWaterMark,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fundedAccountId);

  return newBalance;
}

export async function simulateFundedPosition(
  supabase: SupabaseClient,
  fundedAccountId: string,
  coin: string,
  isBuy: boolean,
  size: number,
  entryPrice: number,
  reduceOnly: boolean
) {
  console.log("=== SIMULATING POSITION FOR FUNDED ACCOUNT ===");
  console.log("Funded Account ID:", fundedAccountId);
  console.log("Coin:", coin);
  console.log("Side:", isBuy ? "BUY" : "SELL");
  console.log("Size:", size);
  console.log("Entry Price:", entryPrice);
  console.log("Reduce Only:", reduceOnly);

  const existingPosition = await getExistingPosition(
    supabase,
    fundedAccountId,
    coin
  );
  const fundedAccount = await getFundedAccount(supabase, fundedAccountId);

  const notional = size * entryPrice;
  const tradingFee = notional * TAKER_FEE_RATE;

  let newPosition: Position | null;
  let realizedPnL = 0;

  if (existingPosition) {
    // const existingSize = parseFloat(existingPosition.size.toString());
    const existingSide = existingPosition.side;

    const isClosing =
      reduceOnly ||
      (existingSide === "long" && !isBuy) ||
      (existingSide === "short" && isBuy);

    if (isClosing) {
      const result = await closePosition(
        supabase,
        existingPosition,
        entryPrice,
        size,
        tradingFee
      );
      newPosition = result.position;
      realizedPnL = result.realizedPnL;
    } else {
      newPosition = await addToPosition(
        supabase,
        existingPosition,
        size,
        entryPrice,
        isBuy,
        tradingFee
      );
    }
  } else {
    if (reduceOnly) {
      throw new Error("Cannot reduce only: no existing position");
    }

    newPosition = await openNewPosition(
      supabase,
      fundedAccountId,
      coin,
      isBuy,
      size,
      entryPrice,
      tradingFee
    );
  }

  const newBalance = await updateFundedAccountBalance(
    supabase,
    fundedAccount,
    fundedAccountId,
    realizedPnL,
    tradingFee,
    existingPosition !== null && newPosition === null
  );

  console.log("=== FUNDED POSITION SIMULATED SUCCESSFULLY ===");
  console.log("Realized PnL:", realizedPnL);
  console.log("Trading Fee:", tradingFee);
  console.log("New Balance:", newBalance);

  return {
    success: true,
    position: newPosition,
    realizedPnL,
    tradingFee,
    newBalance,
  };
}
