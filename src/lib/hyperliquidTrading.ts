import { Wallet, JsonRpcProvider } from 'ethers';

const TESTNET_API_URL = 'https://api.hyperliquid-testnet.xyz';

interface OrderRequest {
  coin: string;
  is_buy: boolean;
  sz: number;
  limit_px: number;
  order_type: {
    limit?: { tif: string };
    trigger?: { isMarket: boolean; triggerPx: number; tpsl: string };
  };
  reduce_only: boolean;
}

interface CancelOrderRequest {
  coin: string;
  oid: number;
}

export class HyperliquidTrading {
  private wallet: Wallet;
  private builderCode?: string;

  constructor(privateKey: string, builderCode?: string) {
    this.wallet = new Wallet(privateKey);
    this.builderCode = builderCode;
  }

  private async signL1Action(action: any, nonce: number): Promise<any> {
    const timestamp = Date.now();

    const connectionId = action.type === 'order'
      ? Buffer.from(JSON.stringify({
          destination: 'Hyperliquid',
          type: 'l1Action',
        })).toString('hex')
      : undefined;

    const phantomAgent = {
      source: 'a',
      connectionId,
    };

    const data = {
      action,
      nonce,
      signature: {
        r: '',
        s: '',
        v: 0,
      },
    };

    const payload = JSON.stringify(data);
    const message = `Hyperliquid signed action:\n${payload}`;
    const signature = await this.wallet.signMessage(message);

    return {
      action,
      nonce,
      signature,
      vaultAddress: null,
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
    const nonce = Date.now();

    const order: OrderRequest = {
      coin,
      is_buy: isBuy,
      sz: size,
      limit_px: price || 0,
      order_type: orderType === 'market'
        ? { trigger: { isMarket: true, triggerPx: price || 0, tpsl: 'tp' } }
        : { limit: { tif: 'Gtc' } },
      reduce_only: reduceOnly,
    };

    const action = {
      type: 'order',
      orders: [order],
      grouping: 'na',
    };

    if (this.builderCode) {
      (action as any).builder = {
        b: this.builderCode,
        f: 10,
      };
    }

    const signedAction = await this.signL1Action(action, nonce);

    const response = await fetch(`${TESTNET_API_URL}/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedAction),
    });

    const result = await response.json();
    return result;
  }

  async cancelOrder(coin: string, oid: number): Promise<any> {
    const nonce = Date.now();

    const action = {
      type: 'cancel',
      cancels: [{
        coin,
        oid,
      }],
    };

    const signedAction = await this.signL1Action(action, nonce);

    const response = await fetch(`${TESTNET_API_URL}/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedAction),
    });

    const result = await response.json();
    return result;
  }

  async cancelAllOrders(coin?: string): Promise<any> {
    const nonce = Date.now();

    const action = {
      type: 'cancelAll',
      coin,
    };

    const signedAction = await this.signL1Action(action, nonce);

    const response = await fetch(`${TESTNET_API_URL}/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedAction),
    });

    const result = await response.json();
    return result;
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
