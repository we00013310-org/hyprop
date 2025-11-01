import { createClient } from 'npm:@supabase/supabase-js@2';
import { Wallet } from 'npm:ethers@6';
import { HttpTransport } from 'npm:@nktkas/hyperliquid@0.25.7';
import { order as placeOrderAPI, cancel as cancelAPI } from 'npm:@nktkas/hyperliquid@0.25.7/api/exchange';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, x-wallet-address',
};

const TESTNET_API_URL = 'https://api.hyperliquid-testnet.xyz';
let assetIndexCache: Map<string, number> | null = null;

async function getAssetIndex(coin: string): Promise<number> {
  if (!assetIndexCache) {
    const response = await fetch(`${TESTNET_API_URL}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'meta' }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch asset metadata: ${response.statusText}`);
    }
    
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const walletAddress = req.headers.get('x-wallet-address');
    if (!walletAddress) {
      throw new Error('Missing wallet address');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress.toLowerCase())
      .maybeSingle();

    if (!user) {
      throw new Error('User not found');
    }

    const { action, accountId } = await req.json();
    console.log('Processing action:', action.type, 'for account:', accountId, 'user:', user.id);

    const { data: account, error: accountError } = await supabase
      .from('test_accounts')
      .select('hl_key, hl_builder_code')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (accountError) {
      console.error('Account query error:', accountError);
      throw new Error(`Account error: ${accountError.message}`);
    }

    if (!account) {
      throw new Error('Account not found or unauthorized');
    }

    if (!account.hl_key) {
      throw new Error('Account has no private key configured. Please set up your Hyperliquid testnet wallet key.');
    }

    // Validate the private key format
    if (!account.hl_key.startsWith('0x') || account.hl_key.length !== 66) {
      throw new Error('Invalid private key format. Expected 0x-prefixed hex string.');
    }

    const wallet = new Wallet(account.hl_key);
    const walletAddress = wallet.address;
    console.log('Trading with wallet address:', walletAddress);
    
    const transport = new HttpTransport({
      url: TESTNET_API_URL,
    });

    let result;

    if (action.type === 'placeOrder') {
      const { coin, isBuy, size, price, orderType, reduceOnly } = action;
      const assetIndex = await getAssetIndex(coin);

      const orderData: any = {
        orders: [{
          a: assetIndex,
          b: isBuy,
          p: price?.toString() || '0',
          s: size.toString(),
          r: reduceOnly || false,
          t: orderType === 'limit'
            ? { limit: { tif: 'Gtc' } }
            : { limit: { tif: 'Ioc' } },
        }],
        grouping: 'na',
      };

      console.log('Placing order with data:', JSON.stringify(orderData));
      console.log('Using wallet:', walletAddress);
      console.log('Testnet URL:', TESTNET_API_URL);
      
      try {
        result = await placeOrderAPI(
          { transport, wallet },
          orderData
        );
        console.log('Order result:', JSON.stringify(result));
      } catch (error: any) {
        console.error('Order placement error:', error);
        throw new Error(`Order failed: ${error.message || String(error)}`);
      }
    } else if (action.type === 'cancelOrder') {
      const { coin, oid } = action;
      const assetIndex = await getAssetIndex(coin);

      result = await cancelAPI(
        { transport, wallet },
        { cancels: [{ a: assetIndex, o: oid }] }
      );
    } else if (action.type === 'cancelAllOrders') {
      result = await cancelAPI(
        { transport, wallet },
        { cancels: [] }
      );
    } else {
      throw new Error('Invalid action type');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Trading error:', error);
    const errorMessage = error.message || String(error);
    
    // Provide helpful error messages
    let userMessage = errorMessage;
    if (errorMessage.includes('does not exist')) {
      userMessage = 'Your wallet is not registered on Hyperliquid testnet. Please visit https://app.hyperliquid-testnet.xyz and connect with this wallet to activate it first.';
    }
    
    return new Response(
      JSON.stringify({ success: false, error: userMessage }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});