import { createClient } from 'npm:@supabase/supabase-js@2';
import { Wallet } from 'npm:ethers@6';
import { HttpTransport } from 'npm:@nktkas/hyperliquid@0.25.7';
import { order as placeOrderAPI, cancel as cancelAPI } from 'npm:@nktkas/hyperliquid@0.25.7/api/exchange';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, accountId } = await req.json();

    const { data: account, error: accountError } = await supabase
      .from('test_accounts')
      .select('hl_key, builder_code')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (accountError || !account) {
      throw new Error('Account not found or unauthorized');
    }

    if (!account.hl_key) {
      throw new Error('Account has no private key configured');
    }

    const wallet = new Wallet(account.hl_key);
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

      if (account.builder_code) {
        orderData.builder = {
          b: account.builder_code,
          f: 10,
        };
      }

      result = await placeOrderAPI(
        { transport, wallet },
        orderData
      );
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
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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