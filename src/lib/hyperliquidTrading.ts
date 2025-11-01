const TESTNET_API_URL = 'https://api.hyperliquid-testnet.xyz';

export class HyperliquidTrading {
  private accountId: string;
  private walletAddress: string;

  constructor(accountId: string, walletAddress: string) {
    this.accountId = accountId;
    this.walletAddress = walletAddress;
  }

  private async callEdgeFunction(action: any): Promise<any> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hyperliquid-trading`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'x-wallet-address': this.walletAddress,
        },
        body: JSON.stringify({
          action,
          accountId: this.accountId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error:', errorText);
      throw new Error(`Trading operation failed: ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Trading operation failed');
    }

    return result.data;
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
      return await this.callEdgeFunction({
        type: 'placeOrder',
        coin,
        isBuy,
        size,
        price,
        orderType,
        reduceOnly,
      });
    } catch (error: any) {
      console.error('Place order error:', error);
      throw error;
    }
  }

  async cancelOrder(coin: string, oid: number): Promise<any> {
    try {
      return await this.callEdgeFunction({
        type: 'cancelOrder',
        coin,
        oid,
      });
    } catch (error: any) {
      console.error('Cancel order error:', error);
      throw error;
    }
  }

  async cancelAllOrders(coin?: string): Promise<any> {
    try {
      return await this.callEdgeFunction({
        type: 'cancelAllOrders',
        coin,
      });
    } catch (error: any) {
      console.error('Cancel all orders error:', error);
      throw error;
    }
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
