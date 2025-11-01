import { Wallet, TypedDataDomain, TypedDataField } from 'ethers';

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
  private builderCode?: string;

  constructor(privateKey: string, builderCode?: string) {
    this.wallet = new Wallet(privateKey);
    this.builderCode = builderCode;
  }

  private async signAction(action: any, nonce: number): Promise<any> {
    const domain: TypedDataDomain = {
      name: 'Exchange',
      version: '1',
      chainId: 1337,
      verifyingContract: '0x0000000000000000000000000000000000000000',
    };

    const types: Record<string, TypedDataField[]> = {
      Agent: [
        { name: 'source', type: 'string' },
        { name: 'connectionId', type: 'bytes32' },
      ],
    };

    const value = {
      source: 'a',
      connectionId: '0x' + Buffer.from(JSON.stringify({
        domain: 'hyperliquid',
        encoding: 'UTF-8',
        connectionId: action.type,
      })).toString('hex').padStart(64, '0'),
    };

    const signature = await this.wallet.signTypedData(domain, types, value);

    return {
      action,
      nonce,
      signature: {
        r: signature.slice(0, 66),
        s: '0x' + signature.slice(66, 130),
        v: parseInt(signature.slice(130, 132), 16),
      },
    };
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
      const nonce = Date.now();

      const action: any = {
        type: 'order',
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
        action.builder = {
          b: this.builderCode,
          f: 10,
        };
      }

      const signedAction = await this.signAction(action, nonce);

      const response = await fetch(`${TESTNET_API_URL}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedAction),
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Place order error:', error);
      throw error;
    }
  }

  async cancelOrder(coin: string, oid: number): Promise<any> {
    try {
      const assetIndex = await getAssetIndex(coin);
      const nonce = Date.now();

      const action = {
        type: 'cancel',
        cancels: [{ a: assetIndex, o: oid }],
      };

      const signedAction = await this.signAction(action, nonce);

      const response = await fetch(`${TESTNET_API_URL}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedAction),
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Cancel order error:', error);
      throw error;
    }
  }

  async cancelAllOrders(coin?: string): Promise<any> {
    try {
      const nonce = Date.now();

      const action = {
        type: 'cancel',
        cancels: [],
      };

      const signedAction = await this.signAction(action, nonce);

      const response = await fetch(`${TESTNET_API_URL}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedAction),
      });

      const result = await response.json();
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
