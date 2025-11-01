import { HttpTransport, ExchangeClient } from '@nktkas/hyperliquid';
import { Wallet } from 'ethers';

const TESTNET_API_URL = 'https://api.hyperliquid-testnet.xyz';

export class HyperliquidTrading {
  private client: ExchangeClient;
  private wallet: Wallet;
  private builderCode?: string;

  constructor(privateKey: string, builderCode?: string) {
    this.wallet = new Wallet(privateKey);
    const transport = new HttpTransport({
      url: TESTNET_API_URL,
    });
    this.client = new ExchangeClient(transport, this.wallet, this.wallet.address);
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
      const orderData: any = {
        coin,
        isBuy,
        sz: size,
        limitPx: price || 0,
        orderType: orderType === 'limit'
          ? { limit: { tif: 'Gtc' } }
          : { limit: { tif: 'Ioc' } },
        reduceOnly,
      };

      if (this.builderCode) {
        orderData.builder = {
          address: this.builderCode,
          fee: 10,
        };
      }

      const result = await this.client.order(orderData);
      return result;
    } catch (error: any) {
      console.error('Place order error:', error);
      throw error;
    }
  }

  async cancelOrder(coin: string, oid: number): Promise<any> {
    try {
      const result = await this.client.cancel({ coin, oid });
      return result;
    } catch (error: any) {
      console.error('Cancel order error:', error);
      throw error;
    }
  }

  async cancelAllOrders(coin?: string): Promise<any> {
    try {
      const cancels = coin ? [{ coin }] : [];
      const result = await this.client.cancel({ cancels });
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
