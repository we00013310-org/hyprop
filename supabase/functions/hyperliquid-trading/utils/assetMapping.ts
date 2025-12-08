/**
 * Asset mapping for Hyperliquid
 * Maps coin symbols to their asset indices
 */

// Common asset indices on Hyperliquid
const ASSET_MAP: Record<string, number> = {
  SOL: 0,
  BTC: 3,
  ETH: 4,
  // Add more as needed
};

/**
 * Get asset index for a coin symbol
 * @param coin - Coin symbol (e.g., "BTC", "ETH")
 * @returns Asset index number
 */
export function getAssetIndex(coin: string): number {
  const normalizedCoin = coin.toUpperCase();

  if (ASSET_MAP[normalizedCoin] !== undefined) {
    return ASSET_MAP[normalizedCoin];
  }

  // If not in map, throw error
  throw new Error(
    `Asset index not found for ${coin}. Please add it to ASSET_MAP in assetMapping.ts`
  );
}

/**
 * Get coin symbol from asset index
 * @param assetIndex - Asset index number
 * @returns Coin symbol
 */
export function getCoinFromAssetIndex(assetIndex: number): string | null {
  for (const [coin, index] of Object.entries(ASSET_MAP)) {
    if (index === assetIndex) {
      return coin;
    }
  }
  return null;
}
