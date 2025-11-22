/* eslint-disable @typescript-eslint/no-explicit-any */
const TESTNET_API_URL = "https://api.hyperliquid-testnet.xyz";

export class HyperliquidTrading {
  private accountId: string;
  private walletAddress: string;
  private isFundedAccount: boolean;

  constructor(
    accountId: string,
    walletAddress: string,
    isFundedAccount = false
  ) {
    this.accountId = accountId;
    this.walletAddress = walletAddress;
    this.isFundedAccount = isFundedAccount;
  }

  private async callEdgeFunction(action: any) {
    if (!this.walletAddress) {
      throw new Error("Wallet not connected");
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hyperliquid-trading`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          "x-wallet-address": this.walletAddress,
        },
        body: JSON.stringify({
          action,
          accountId: this.accountId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Edge function error:", errorText);
      throw new Error(`Trading operation failed: ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Trading operation failed");
    }

    return result.data;
  }

  async placeOrder(
    coin: string,
    isBuy: boolean,
    size: number,
    price: number | null,
    orderType: "market" | "limit",
    reduceOnly: boolean = false
  ) {
    try {
      return await this.callEdgeFunction({
        type: this.isFundedAccount ? "placeFundedOrder" : "placeOrder",
        coin,
        isBuy,
        size,
        price,
        orderType,
        reduceOnly,
      });
    } catch (error: any) {
      console.error("Place order error:", error);
      throw error;
    }
  }

  async cancelOrder(coin: string, oid: number): Promise<any> {
    try {
      return await this.callEdgeFunction({
        type: "cancelOrder",
        coin,
        oid,
      });
    } catch (error: any) {
      console.error("Cancel order error:", error);
      throw error;
    }
  }

  async cancelAllOrders(coin?: string): Promise<any> {
    try {
      return await this.callEdgeFunction({
        type: "cancelAllOrders",
        coin,
      });
    } catch (error: any) {
      console.error("Cancel all orders error:", error);
      throw error;
    }
  }

  async closePosition(coin: string, size: number, price: number): Promise<any> {
    try {
      // Determine if we need to buy (close short) or sell (close long)
      const isBuy = size < 0; // If size is negative (short), we buy to close
      const absSize = Math.abs(size);

      return await this.callEdgeFunction({
        type: this.isFundedAccount ? "placeFundedOrder" : "placeOrder",
        coin,
        isBuy,
        size: absSize,
        price, // Market order to close
        orderType: "market",
        reduceOnly: true, // Important: reduceOnly ensures we're closing, not opening
      });
    } catch (error: any) {
      console.error("Close position error:", error);
      throw error;
    }
  }

  async updatePositionPnL(): Promise<any> {
    try {
      return await this.callEdgeFunction({
        type: this.isFundedAccount
          ? "updateFundedPositionPnL"
          : "updatePositionPnL",
      });
    } catch (error: any) {
      console.error("Update position PnL error:", error);
      throw error;
    }
  }

  async checkTestStatus(): Promise<any> {
    try {
      return await this.callEdgeFunction({
        type: "checkTestStatus",
      });
    } catch (error: any) {
      console.error("Check test status error:", error);
      throw error;
    }
  }

  async checkFundedStatus(): Promise<any> {
    try {
      return await this.callEdgeFunction({
        type: "checkFundedStatus",
      });
    } catch (error: any) {
      console.error("Check funded status error:", error);
      throw error;
    }
  }

  async getFundedPositions(): Promise<any> {
    try {
      return await this.callEdgeFunction({
        type: "getFundedPositions",
      });
    } catch (error: any) {
      console.error("Get funded positions error:", error);
      throw error;
    }
  }
}

export async function getOpenOrders(address: string): Promise<any[]> {
  try {
    const response = await fetch(`${TESTNET_API_URL}/info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "openOrders",
        user: address,
      }),
    });

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Failed to fetch open orders:", error);
    return [];
  }
}

export async function getUserFills(address: string): Promise<any[]> {
  try {
    const response = await fetch(`${TESTNET_API_URL}/info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "userFills",
        user: address,
      }),
    });

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Failed to fetch user fills:", error);
    return [];
  }
}

export async function getUserPositions(
  accountId?: string,
  walletAddress?: string,
  isFundedAccount = false
) {
  // PHASE 1: For test accounts, get positions from database
  if (accountId && walletAddress) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hyperliquid-trading`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            "x-wallet-address": walletAddress,
          },
          body: JSON.stringify({
            action: {
              type: isFundedAccount ? "getFundedPositions" : "getTestPositions",
            },
            accountId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch test positions: ${response.statusText}`
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch positions");
      }

      return result.data || [];
    } catch (error) {
      console.error("Failed to fetch positions:", error);
      return [];
    }
  }

  return [];
}

export const getAccountInfo = async (
  accountId: string,
  walletAddress?: string,
  isFundedAccount = false
) => {
  try {
    if (walletAddress) {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hyperliquid-trading`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            "x-wallet-address": walletAddress,
          },
          body: JSON.stringify({
            action: {
              type: isFundedAccount ? "getFundedAccount" : "getTestAccount",
            },
            accountId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch info");
      }

      return result;
    }
  } catch (error) {
    console.error("Failed to fetch account info:", error);
    return [];
  }
};
