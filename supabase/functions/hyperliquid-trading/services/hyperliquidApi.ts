/* eslint-disable @typescript-eslint/no-explicit-any */
import { Wallet } from "npm:ethers@6";
import {
  ExchangeClient,
  HttpTransport,
  InfoClient,
} from "npm:@nktkas/hyperliquid@0.25.7";

import { getAssetIndex } from "../utils/assetMapping.ts";
import { TESTNET_API_URL } from "../constants.ts";
import { ClearinghouseStateResponse } from "../types.ts";

/**
 * Fetch current price from Hyperliquid for a specific coin
 */
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

export interface OrderParams {
  coin: string;
  isBuy: boolean;
  size: string;
  price?: string;
  orderType: "market" | "limit";
  reduceOnly?: boolean;
  slippage?: number;
}

/**
 * Format size with correct precision for the asset
 * Hyperliquid requires specific decimal places
 */
function formatSize(size: string, coin: string): string {
  const num = parseFloat(size);

  // Size precision by coin
  const sizePrecision: Record<string, number> = {
    BTC: 4, // 0.0001
    ETH: 3, // 0.001
    SOL: 1, // 0.1
  };

  const precision = sizePrecision[coin.toUpperCase()] || 4;
  return num.toFixed(precision);
}

/**
 * Format price with correct tick size for the asset
 * Hyperliquid requires prices to be divisible by tick size
 */
function formatPrice(price: string, coin: string): string {
  const num = parseFloat(price);

  // Tick size by coin (minimum price increment)
  const tickSize: Record<string, number> = {
    BTC: 1, // $1 increments
    ETH: 0.1, // $0.1 increments
    SOL: 0.001, // $0.001 increments
  };

  const tick = tickSize[coin.toUpperCase()] || 0.1;

  // Round to nearest tick
  const rounded = Math.round(num / tick) * tick;

  // Get decimal places from tick size
  const decimals = tick.toString().split(".")[1]?.length || 0;

  return rounded.toFixed(decimals);
}

export interface TriggerOrderParams {
  coin: string;
  isBuy: boolean;
  size: string;
  triggerPrice: string;
  orderPrice?: string;
  tpsl: "tp" | "sl"; // take profit or stop loss
  reduceOnly?: boolean;
}

/**
 * Create an order on Hyperliquid
 */
export async function createOrder(
  wallet: Wallet,
  params: OrderParams
): Promise<any> {
  const { coin, isBuy, size, price, orderType, reduceOnly = false } = params;

  // Get asset index
  const assetIndex = getAssetIndex(coin);

  // Initialize exchange client
  const transport = new HttpTransport({ isTestnet: true });
  const exchangeClient = new ExchangeClient({
    wallet,
    transport,
    isTestnet: true,
  });

  // Determine order price and type spec
  let orderPrice: string;
  let orderTypeSpec: any;

  if (!price) {
    throw new Error("Price is required");
  }

  if (orderType === "market") {
    // For market orders, use limit IOC with a wide price
    // Price should be favorable to guarantee fill
    const slippagePrice = isBuy ? +(price || 0) * 1.05 : +(price || 0) * 0.95;
    orderPrice = formatPrice(slippagePrice.toString(), coin);
    orderTypeSpec = { limit: { tif: "Ioc" } };
  } else {
    orderPrice = formatPrice(price, coin);
    orderTypeSpec = { limit: { tif: "Gtc" } };
  }

  // Format size with correct precision
  const formattedSize = formatSize(size, coin);

  const payload = {
    orders: [
      {
        a: assetIndex,
        b: isBuy,
        p: orderPrice,
        s: formattedSize,
        r: reduceOnly,
        t: orderTypeSpec,
      },
    ],
    grouping: "na",
  };

  console.log("Creating ORDER:", JSON.stringify(payload, null, 2));

  // Place the order
  const result = await exchangeClient.order(payload);

  return result;
}

/**
 * Create a trigger order (stop loss or take profit)
 */
export async function createTriggerOrder(
  wallet: Wallet,
  params: TriggerOrderParams
): Promise<any> {
  const {
    coin,
    isBuy,
    size,
    triggerPrice,
    orderPrice,
    tpsl,
    reduceOnly = true,
  } = params;

  // Get asset index
  const assetIndex = getAssetIndex(coin);

  // Initialize exchange client
  const transport = new HttpTransport({ isTestnet: true });
  const exchangeClient = new ExchangeClient({
    wallet,
    transport,
    isTestnet: true,
  });

  console.log("Creating trigger order:", {
    assetIndex,
    coin,
    isBuy,
    triggerPrice,
    orderPrice: orderPrice || "market",
    size,
    tpsl,
    reduceOnly,
  });

  // Place the trigger order
  const result = await exchangeClient.order({
    orders: [
      {
        a: assetIndex,
        b: isBuy,
        p: orderPrice || triggerPrice, // Use orderPrice if provided, otherwise triggerPrice
        s: size,
        r: reduceOnly,
        t: {
          trigger: {
            isMarket: !orderPrice, // Market if no orderPrice specified
            triggerPx: triggerPrice,
            tpsl: tpsl,
          },
        },
      },
    ],
    grouping: "na",
  });

  return result;
}

/**
 * Create a bracket order (entry + stop loss + take profit)
 */
export async function createBracketOrder(
  wallet: Wallet,
  params: {
    coin: string;
    isBuy: boolean;
    size: string;
    entryPrice?: string;
    stopLoss: string;
    takeProfit: string;
    orderType?: "market" | "limit";
  }
): Promise<any> {
  const {
    coin,
    isBuy,
    size,
    entryPrice,
    stopLoss,
    takeProfit,
    orderType = "market",
  } = params;

  // Get asset index
  const assetIndex = getAssetIndex(coin);

  // Initialize exchange client
  const transport = new HttpTransport({ isTestnet: true });
  const exchangeClient = new ExchangeClient({
    wallet,
    transport,
    isTestnet: true,
  });

  const orders: any[] = [];

  // 1. Entry order
  if (orderType === "market") {
    orders.push({
      a: assetIndex,
      b: isBuy,
      p: "0",
      s: size,
      r: false,
      t: { market: {} },
    });
  } else {
    if (!entryPrice) {
      throw new Error("Entry price is required for limit orders");
    }
    orders.push({
      a: assetIndex,
      b: isBuy,
      p: entryPrice,
      s: size,
      r: false,
      t: { limit: { tif: "Gtc" } },
    });
  }

  // 2. Stop loss (opposite side)
  orders.push({
    a: assetIndex,
    b: !isBuy,
    p: stopLoss,
    s: size,
    r: true,
    t: {
      trigger: {
        isMarket: true,
        triggerPx: stopLoss,
        tpsl: "sl",
      },
    },
  });

  // 3. Take profit (opposite side)
  orders.push({
    a: assetIndex,
    b: !isBuy,
    p: takeProfit,
    s: size,
    r: true,
    t: {
      trigger: {
        isMarket: true,
        triggerPx: takeProfit,
        tpsl: "tp",
      },
    },
  });

  console.log("Creating bracket order:", {
    assetIndex,
    coin,
    isBuy,
    entryPrice: entryPrice || "market",
    stopLoss,
    takeProfit,
    size,
  });

  // Place all orders together
  const result = await exchangeClient.order({
    orders,
    grouping: "normalTpsl", // Group TP/SL orders
  });

  return result;
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  wallet: Wallet,
  coin: string,
  orderId: number
): Promise<any> {
  const assetIndex = getAssetIndex(coin);

  const transport = new HttpTransport({ isTestnet: true });
  const exchangeClient = new ExchangeClient({
    wallet,
    transport,
    isTestnet: true,
  });

  console.log("Canceling order:", { assetIndex, coin, orderId });

  const result = await exchangeClient.cancel({
    cancels: [
      {
        a: assetIndex,
        o: orderId,
      },
    ],
  });

  return result;
}

/**
 * Cancel all orders for a specific coin
 */
export async function cancelAllOrders(
  accountAddress: string,
  wallet: Wallet
): Promise<any> {
  const transport = new HttpTransport({ isTestnet: true });
  const exchangeClient = new ExchangeClient({
    wallet,
    transport,
    isTestnet: true,
  });
  const infoClient = new InfoClient({
    transport,
    isTestnet: true,
  });
  const openOrders = await infoClient.openOrders({ user: accountAddress });

  if (openOrders.length) {
    const result = await exchangeClient.cancel({
      cancels: openOrders.map((o) => ({
        a: getAssetIndex(o.coin),
        o: o.oid,
      })),
    });

    return result;
  }

  return [];
}

/**
 * Close a position (market order to close)
 */
export async function closePosition(
  wallet: Wallet,
  coin: string,
  size: string,
  isBuy: boolean // Original position side (we'll close opposite)
): Promise<any> {
  console.log("Closing position:", {
    coin,
    size,
    originalSide: isBuy ? "long" : "short",
  });

  // Fetch current price from Hyperliquid
  const currentPrice = await fetchHyperliquidPrice(coin);
  console.log(`Current ${coin} price: ${currentPrice}`);

  // For closing, we sell if it was a long, buy if it was a short
  const isClosingBuy = !isBuy;

  // Apply slippage for market order (5% to ensure fill)
  const slippagePrice = isClosingBuy
    ? currentPrice * 1.05 // Buy higher
    : currentPrice * 0.95; // Sell lower

  const assetIndex = getAssetIndex(coin);
  const formattedPrice = formatPrice(slippagePrice.toString(), coin);
  const formattedSize = formatSize(size, coin);

  const transport = new HttpTransport({ isTestnet: true });
  const exchangeClient = new ExchangeClient({
    wallet,
    transport,
    isTestnet: true,
  });

  const payload = {
    orders: [
      {
        a: assetIndex,
        b: isClosingBuy,
        p: formattedPrice,
        s: formattedSize,
        r: true, // Reduce only
        t: { limit: { tif: "Ioc" } }, // Immediate or Cancel for market-like execution
      },
    ],
    grouping: "na",
  };

  console.log(
    "Closing position with payload:",
    JSON.stringify(payload, null, 2)
  );

  const result = await exchangeClient.order(payload);

  return result;
}

/**
 * Update leverage for a specific asset
 */
export async function updateLeverage(
  wallet: Wallet,
  coin: string,
  leverage: number,
  isCross: boolean = false
): Promise<any> {
  const assetIndex = getAssetIndex(coin);

  const transport = new HttpTransport({ isTestnet: true });
  const exchangeClient = new ExchangeClient({
    wallet,
    transport,
    isTestnet: true,
  });

  const result = await exchangeClient.updateLeverage({
    asset: assetIndex,
    isCross,
    leverage,
  });

  console.log("UPDATED LEVERAGE", result);

  return result;
}

export async function getAccountInfo(
  address: string
): Promise<ClearinghouseStateResponse> {
  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "clearinghouseState",
      user: address,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch account info: ${response.statusText}`);
  }

  const state = await response.json();
  return state as ClearinghouseStateResponse;
}

export async function getOpenOrders(address: string): Promise<any> {
  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "openOrders",
      user: address,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch open orders: ${response.statusText}`);
  }

  const state = await response.json();
  return state as any;
}
