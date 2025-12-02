/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { TAKER_FEE_RATE, DEFAULT_LEVERAGE } from "../constants.ts";
import type { TestAccount, TestPosition } from "../types.ts";
import { getRealOraclePrice, calculatePnL } from "../utils/priceOracle.ts";
import { getTestAccount } from "./accountCreator.ts";

async function getExistingPosition(
  supabase: SupabaseClient,
  testAccountId: string,
  coin: string
): Promise<TestPosition | null> {
  const { data: existingPosition } = await supabase
    .from("test_positions")
    .select("*")
    .eq("test_account_id", testAccountId)
    .eq("symbol", coin)
    .maybeSingle();

  return existingPosition;
}

async function createTpSlOrders(
  supabase: SupabaseClient,
  testAccountId: string,
  coin: string,
  size: number,
  isBuy: boolean, // Side of the entry order
  tpPrice?: number | null,
  slPrice?: number | null
) {
  const orders: any[] = [];
  const side = !isBuy ? "buy" : "sell"; // TP/SL are opposite to entry

  if (tpPrice) {
    orders.push({
      test_account_id: testAccountId,
      symbol: coin,
      side,
      size,
      price: tpPrice,
      order_type: "limit",
      reduce_only: true,
      status: "open",
    });
  }

  if (slPrice) {
    orders.push({
      test_account_id: testAccountId,
      symbol: coin,
      side,
      size,
      price: slPrice,
      order_type: "limit",
      reduce_only: true,
      status: "open",
    });
  }

  if (orders.length > 0) {
    const { error } = await supabase.from("test_orders").insert(orders);
    if (error) {
      console.error("Failed to create TP/SL orders:", error);
    } else {
      console.log(`Created ${orders.length} TP/SL orders`);
    }
  }
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
  existingPosition: TestPosition,
  entryPrice: number,
  size: number,
  tradingFee: number
): Promise<{ position: TestPosition | null; realizedPnL: number }> {
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
    await supabase
      .from("test_positions")
      .delete()
      .eq("id", existingPosition.id);

    return { position: null, realizedPnL };
  }

  const newSide = newSize > 0 ? "long" : "short";
  const currentOraclePrice = await getRealOraclePrice(
    existingPosition.symbol,
    supabase
  );
  const newUpnl = calculatePnL(entryPrice, currentOraclePrice, newSize);

  await supabase
    .from("test_positions")
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
    .from("test_positions")
    .select("*")
    .eq("id", existingPosition.id)
    .single();

  return { position: updated, realizedPnL };
}

async function addToPosition(
  supabase: SupabaseClient,
  existingPosition: TestPosition,
  size: number,
  entryPrice: number,
  isBuy: boolean,
  tradingFee: number,
  tpPrice?: number | null,
  slPrice?: number | null
): Promise<TestPosition> {
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

  // Prepare update object
  const updateData: any = {
    size: newSize,
    avg_entry: newEntry,
    margin_used: (Math.abs(newSize) * newEntry) / DEFAULT_LEVERAGE,
    upnl: newUpnl,
    fees_accrued:
      (parseFloat(existingPosition.fees_accrued.toString()) || 0) + tradingFee,
    last_update_ts: new Date().toISOString(),
  };

  // Create TP/SL orders if provided
  await createTpSlOrders(
    supabase,
    existingPosition.test_account_id,
    existingPosition.symbol,
    size,
    isBuy,
    tpPrice,
    slPrice
  );

  await supabase
    .from("test_positions")
    .update(updateData)
    .eq("id", existingPosition.id);

  const { data: updated } = await supabase
    .from("test_positions")
    .select("*")
    .eq("id", existingPosition.id)
    .single();

  return updated;
}

async function openNewPosition(
  supabase: SupabaseClient,
  testAccountId: string,
  coin: string,
  isBuy: boolean,
  size: number,
  entryPrice: number,
  tradingFee: number,
  tpPrice?: number | null,
  slPrice?: number | null
): Promise<TestPosition> {
  const side = isBuy ? "long" : "short";
  const signedSize = isBuy ? size : -size;
  const marginUsed = (size * entryPrice) / DEFAULT_LEVERAGE;

  const currentOraclePrice = await getRealOraclePrice(coin, supabase);
  const initialUpnl = calculatePnL(entryPrice, currentOraclePrice, signedSize);

  const { data: newPos } = await supabase
    .from("test_positions")
    .insert({
      test_account_id: testAccountId,
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

  await createTpSlOrders(
    supabase,
    testAccountId,
    coin,
    size,
    isBuy,
    tpPrice,
    slPrice
  );

  return newPos;
}

async function updateTestAccountBalance(
  supabase: SupabaseClient,
  testAccount: TestAccount,
  testAccountId: string,
  realizedPnL: number,
  tradingFee: number,
  positionClosed: boolean
): Promise<number> {
  let newBalance: number;

  if (positionClosed) {
    newBalance = testAccount.virtual_balance + realizedPnL;
  } else {
    newBalance = testAccount.virtual_balance + realizedPnL - tradingFee;
  }

  const newHighWaterMark = Math.max(
    testAccount.high_water_mark || testAccount.account_size,
    newBalance
  );

  await supabase
    .from("test_accounts")
    .update({
      virtual_balance: newBalance,
      high_water_mark: newHighWaterMark,
      updated_at: new Date().toISOString(),
    })
    .eq("id", testAccountId);

  return newBalance;
}

export async function simulatePosition(
  supabase: SupabaseClient,
  testAccountId: string,
  coin: string,
  isBuy: boolean,
  size: number,
  entryPrice: number,
  reduceOnly: boolean,
  tpPrice?: number | null,
  slPrice?: number | null
) {
  console.log("=== SIMULATING POSITION FOR TEST ACCOUNT ===");
  console.log("Test Account ID:", testAccountId);
  console.log("Coin:", coin);
  console.log("Side:", isBuy ? "BUY" : "SELL");
  console.log("Size:", size);
  console.log("Entry Price:", entryPrice);
  console.log("Reduce Only:", reduceOnly);
  console.log("TP Price:", tpPrice);
  console.log("SL Price:", slPrice);

  const existingPosition = await getExistingPosition(
    supabase,
    testAccountId,
    coin
  );
  const testAccount = await getTestAccount(supabase, testAccountId);

  const notional = size * entryPrice;
  const tradingFee = notional * TAKER_FEE_RATE;

  let newPosition: TestPosition | null;
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
        tradingFee,
        tpPrice,
        slPrice
      );
    }
  } else {
    if (reduceOnly) {
      throw new Error("Cannot reduce only: no existing position");
    }

    newPosition = await openNewPosition(
      supabase,
      testAccountId,
      coin,
      isBuy,
      size,
      entryPrice,
      tradingFee,
      tpPrice,
      slPrice
    );
  }

  const newBalance = await updateTestAccountBalance(
    supabase,
    testAccount,
    testAccountId,
    realizedPnL,
    tradingFee,
    existingPosition !== null && newPosition === null
  );

  console.log("=== POSITION SIMULATED SUCCESSFULLY ===");
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
