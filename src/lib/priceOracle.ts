/**
 * Real-world price oracle for BTC
 * Uses CoinGecko API as primary source
 */

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

export interface PriceData {
  price: number;
  timestamp: number;
  source: string;
}

/**
 * Get real-world BTC price from CoinGecko
 */
export async function getRealBTCPrice(): Promise<number> {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=bitcoin&vs_currencies=usd`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
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
  } catch (error) {
    console.error("Failed to fetch BTC price from CoinGecko:", error);
    throw error;
  }
}

/**
 * Get demo price offset from localStorage (for testing only)
 */
export function getDemoPriceOffset(): number {
  try {
    const offset = localStorage.getItem("demo_btc_price_offset");
    if (offset) {
      const parsed = parseFloat(offset);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to read demo price offset:", error);
  }
  return 0;
}

/**
 * Get real-world BTC price with fallback to Binance
 */
export async function getRealBTCPriceWithFallback(): Promise<PriceData> {
  // Try CoinGecko first
  try {
    const price = await getRealBTCPrice();
    const demoOffset = getDemoPriceOffset();
    const adjustedPrice = price + demoOffset;

    return {
      price: adjustedPrice,
      timestamp: Date.now(),
      source:
        demoOffset !== 0 ? "coingecko (demo offset applied)" : "coingecko",
    };
  } catch (error) {
    console.warn("CoinGecko failed, trying Binance fallback:", error);

    // Fallback to Binance
    try {
      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
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

      const demoOffset = getDemoPriceOffset();
      const adjustedPrice = price + demoOffset;

      return {
        price: adjustedPrice,
        timestamp: Date.now(),
        source: demoOffset !== 0 ? "binance (demo offset applied)" : "binance",
      };
    } catch (binanceError) {
      console.error("Both price sources failed:", binanceError);
      throw new Error("Failed to fetch BTC price from all sources");
    }
  }
}

/**
 * Calculate PNL using real-world price
 * @param entryPrice - Entry price of the position
 * @param currentPrice - Current real-world price
 * @param size - Position size (positive for long, negative for short)
 * @returns Unrealized PNL in USD
 */
export function calculateRealWorldPNL(
  entryPrice: number,
  currentPrice: number,
  size: number
): number {
  if (size === 0) return 0;

  const isLong = size > 0;
  const absSize = Math.abs(size);

  if (isLong) {
    // Long: profit when price goes up
    return (currentPrice - entryPrice) * absSize;
  } else {
    // Short: profit when price goes down
    return (entryPrice - currentPrice) * absSize;
  }
}

/**
 * Calculate PNL percentage based on margin used
 * @param pnl - Unrealized PNL in USD
 * @param marginUsed - Margin used for the position
 * @returns PNL as percentage
 */
export function calculatePNLPercentage(
  pnl: number,
  marginUsed: number
): number {
  if (marginUsed === 0) return 0;
  return (pnl / marginUsed) * 100;
}
