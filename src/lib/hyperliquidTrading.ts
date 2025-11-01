import { Wallet } from 'ethers';
import { order as placeOrderAPI, cancel as cancelAPI } from '@nktkas/hyperliquid/api/exchange';
import { HttpTransport } from '@nktkas/hyperliquid';

const TESTNET_API_URL = 'https://api.hyperliquid-testnet.xyz';

let assetIndexCache: Map<string, number> | null = null;

async function getAssetIndex(coin: string): Promise<number> {
  if (!assetIndexCache) {
    const response = await fetch(`${TESTNET_API_URL}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'meta' }),
    });
    const meta = await response.json();

    assetIndexCache = new Map();
    meta.universe.forEach((asset: any, index: number) => {
      assetIndexCache!.set(asset.name, index);
    });
  }

  const index = assetIndexCache.get(coin);
  if (index === undefined) {
    throw new Error(`Asset ${coin} not found`);
  }
  return index;
}

export class HyperliquidTrading {
  private wallet: Wallet;
  private transport: HttpTransport;
  private builderCode?: string;

  constructor(privateKey: string, builderCode?: string) {
    this.wallet = new Wallet(privateKey);
    this.transport = new HttpTransport({
      url: TESTNET_API_URL,
    });
    this.builderCode = builderCode;
  }

  async placeOrder(
    coin: string,
    isBuy: boolean,
    size: number,
    price: number | null,
    orderType: 'market' | 'limit',
    reduceOnly: boolean = false
  ): Promise<any> {
    try {
      const assetIndex = await getAssetIndex(coin);

      const orderData: any = {
        orders: [{
          a: assetIndex,
          b: isBuy,
          p: price?.toString() || '0',
          s: size.toString(),
          r: reduceOnly,
          t: orderType === 'limit'
            ? { limit: { tif: 'Gtc' } }
            : { limit: { tif: 'Ioc' } },
        }],
        grouping: 'na',
      };

      if (this.builderCode) {
        orderData.builder = {
          b: this.builderCode,
          f: 10,
        };
      }

      const result = await placeOrderAPI(
        { transport: this.transport, wallet: this.wallet },
        orderData
      );
      return result;
    } catch (error: any) {
      console.error('Place order error:', error);
      throw error;
    }
  }

  async cancelOrder(coin: string, oid: number): Promise<any> {
    try {
      const assetIndex = await getAssetIndex(coin);

      const result = await cancelAPI(
        { transport: this.transport, wallet: this.wallet },
        { cancels: [{ a: assetIndex, o: oid }] }
      );
      return result;
    } catch (error: any) {
      console.error('Cancel order error:', error);
      throw error;
    }
  }

  async cancelAllOrders(coin?: string): Promise<any> {
    try {
      const result = await cancelAPI(
        { transport: this.transport, wallet: this.wallet },
        { cancels: [] }
      );
      return result;
    } catch (error: any) {
      console.error('Cancel all orders error:', error);
      throw error;
    }
  }

  getAddress(): string {
    return this.wallet.address;
  }
}

export async function getOpenOrders(address: string): Promise<any[]> {
  try {
    const response = await fetch(`${TESTNET_API_URL}/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'openOrders',
        user: address,
      }),
    });

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Failed to fetch open orders:', error);
    return [];
  }
}

export async function getUserFills(address: string): Promise<any[]> {
  try {
    const response = await fetch(`${TESTNET_API_URL}/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'userFills',
        user: address,
      }),
    });

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Failed to fetch user fills:', error);
    return [];
  }
}

export async function getUserPositions(address: string): Promise<any[]> {
  try {
    const response = await fetch(`${TESTNET_API_URL}/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'clearinghouseState',
        user: address,
      }),
    });

    const data = await response.json();
    return data?.assetPositions || [];
  } catch (error) {
    console.error('Failed to fetch positions:', error);
    return [];
  }
}
