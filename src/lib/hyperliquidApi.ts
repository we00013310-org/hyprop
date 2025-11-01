const TESTNET_API_URL = 'https://api.hyperliquid-testnet.xyz/info';

interface AccountBalance {
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
}

export async function getAccountBalance(walletAddress: string): Promise<number> {
  try {
    const response = await fetch(TESTNET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'clearinghouseState',
        user: walletAddress,
      }),
    });

    const data: AccountBalance = await response.json();

    if (data?.marginSummary?.accountValue) {
      return parseFloat(data.marginSummary.accountValue);
    }

    return 0;
  } catch (error) {
    console.error('Failed to fetch account balance:', error);
    return 0;
  }
}
