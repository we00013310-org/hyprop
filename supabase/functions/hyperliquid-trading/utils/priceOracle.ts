import { TESTNET_API_URL } from "../constants.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

async function getDemoPriceOffset(supabase: SupabaseClient): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("config")
      .select("value")
      .eq("key", "demo_btc_price_offset")
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch demo price offset:", error);
      return 0;
    }

    if (data?.value) {
      const offset = parseFloat(data.value as string);
      if (!isNaN(offset)) {
        // console.log("Applying demo price offset:", offset);
        return offset;
      }
    }

    return 0;
  } catch (error) {
    console.error("Error reading demo price offset:", error);
    return 0;
  }
}

async function fetchCoinGeckoPrice(): Promise<number> {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.statusText}`);
  }

  const data = await response.json();
  const price = data.bitcoin?.usd;

  if (!price || typeof price !== "number") {
    throw new Error("Invalid price data from CoinGecko");
  }

  return price;
}

async function fetchBinancePrice(): Promise<number> {
  const response = await fetch(
    "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.statusText}`);
  }

  const data = await response.json();
  const price = parseFloat(data.price);

  if (!price || isNaN(price)) {
    throw new Error("Invalid price data from Binance");
  }

  return price;
}

async function fetchHyperliquidPrice(coin: string): Promise<number> {
  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "allMids" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch current prices: ${response.statusText}`);
  }

  const mids = await response.json();
  const priceStr = mids[coin];

  if (!priceStr) {
    throw new Error(`No price found for ${coin}`);
  }

  const price = parseFloat(priceStr);
  if (isNaN(price)) {
    throw new Error(`Invalid price for ${coin}: ${priceStr}`);
  }

  return price;
}

export async function getRealOraclePrice(
  coin: string,
  supabase: SupabaseClient
): Promise<number> {
  let basePrice: number;

  if (coin === "BTC") {
    try {
      basePrice = await fetchHyperliquidPrice(coin);
    } catch (error) {
      console.warn("Hyperliquid failed, trying Binance fallback:", error);
      try {
        basePrice = await fetchBinancePrice();
      } catch (binanceError) {
        console.error("Both price sources failed:", binanceError);
        basePrice = await fetchCoinGeckoPrice();
      }
    }
  } else {
    basePrice = await fetchHyperliquidPrice(coin);
  }

  const offset = await getDemoPriceOffset(supabase);
  const adjustedPrice = basePrice + offset;

  // console.log(
  //   `Price for ${coin}: base=${basePrice}, offset=${offset}, adjusted=${adjustedPrice}`
  // );

  return adjustedPrice;
}

export function calculatePnL(
  entryPrice: number,
  currentPrice: number,
  size: number
): number {
  if (size === 0) return 0;

  const isLong = size > 0;
  const absSize = Math.abs(size);

  if (isLong) {
    return (currentPrice - entryPrice) * absSize;
  } else {
    return (entryPrice - currentPrice) * absSize;
  }
}
