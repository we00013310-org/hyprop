import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Wallet } from 'npm:ethers@6';
import { HttpTransport } from 'npm:@nktkas/hyperliquid@0.25.7';
import { order as placeOrderAPI, cancel as cancelAPI, approveBuilderFee as approveBuilderFeeAPI } from 'npm:@nktkas/hyperliquid@0.25.7/api/exchange';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, x-wallet-address',
};

const TESTNET_API_URL = 'https://api.hyperliquid-testnet.xyz';
let assetIndexCache: Map<string, number> | null = null;
let assetMetaCache: Map<string, any> | null = null;

async function loadAssetMetadata(): Promise<void> {
  if (assetIndexCache && assetMetaCache) return;
  
  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'meta' }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch asset metadata: ${response.statusText}`);
  }
  
  const meta = await response.json();
  console.log('Asset metadata:', JSON.stringify(meta));

  assetIndexCache = new Map();
  assetMetaCache = new Map();
  meta.universe.forEach((asset: any, index: number) => {
    assetIndexCache!.set(asset.name, index);
    assetMetaCache!.set(asset.name, asset);
  });
}

async function getAssetIndex(coin: string): Promise<number> {
  await loadAssetMetadata();
  const index = assetIndexCache!.get(coin);
  if (index === undefined) {
    throw new Error(`Asset ${coin} not found`);
  }
  return index;
}

async function getAssetMeta(coin: string): Promise<any> {
  await loadAssetMetadata();
  const meta = assetMetaCache!.get(coin);
  if (!meta) {
    throw new Error(`Asset metadata for ${coin} not found`);
  }
  return meta;
}

function formatPrice(price: number, szDecimals: number): string {
  const formatted = price.toFixed(szDecimals);
  console.log(`Formatted price ${price} with ${szDecimals} decimals -> ${formatted}`);
  return formatted;
}

async function getCurrentPrice(coin: string): Promise<number> {
  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'allMids' }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch current prices: ${response.statusText}`);
  }
  
  const mids = await response.json();
  console.log('All mids:', JSON.stringify(mids));
  
  const priceStr = mids[coin];
  if (!priceStr) {
    throw new Error(`No price found for ${coin}`);
  }
  
  const price = parseFloat(priceStr);
  if (isNaN(price)) {
    throw new Error(`Invalid price for ${coin}: ${priceStr}`);
  }
  
  console.log(`Current price for ${coin}: ${price}`);
  return price;
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
    console.log('=== NEW REQUEST ===');
    console.log('Action:', JSON.stringify(action));
    console.log('Account ID:', accountId);
    console.log('User ID:', user.id);

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
      throw new Error('Account has no private key configured.');
    }

    if (!account.hl_key.startsWith('0x') || account.hl_key.length !== 66) {
      throw new Error('Invalid private key format.');
    }

    const wallet = new Wallet(account.hl_key);
    const derivedAddress = wallet.address;
    console.log('Wallet address:', derivedAddress);
    
    const transport = new HttpTransport({
      isTestnet: true,
    });

    let result;

    if (action.type === 'approveBuilderFee') {
      const BUILDER_ADDRESS = '0x7c4E42B6cDDcEfa029D230137908aB178D52d324';

      console.log('=== APPROVING BUILDER FEE ===');
      console.log('Builder address:', BUILDER_ADDRESS);
      console.log('Max fee rate: 0.1%');

      try {
        result = await approveBuilderFeeAPI(
          { transport, wallet },
          {
            maxFeeRate: '0.1%',
            builder: BUILDER_ADDRESS,
          }
        );
        console.log('=== BUILDER FEE APPROVED ===');
        console.log('Result:', JSON.stringify(result));
      } catch (error: any) {
        console.error('=== BUILDER FEE APPROVAL ERROR ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        throw new Error(`Builder fee approval failed: ${error.message || String(error)}`);
      }
    } else if (action.type === 'placeOrder') {
      const { coin, isBuy, size, price, orderType, reduceOnly } = action;
      
      console.log('=== ORDER DETAILS ===');
      console.log('Coin:', coin);
      console.log('Side:', isBuy ? 'BUY' : 'SELL');
      console.log('Size:', size, typeof size);
      console.log('Price:', price, typeof price);
      console.log('Order Type:', orderType);
      console.log('Reduce Only:', reduceOnly);
      
      const assetIndex = await getAssetIndex(coin);
      const assetMeta = await getAssetMeta(coin);
      
      console.log('Asset index:', assetIndex);
      console.log('Asset meta:', JSON.stringify(assetMeta));

      let finalPrice: string;
      if (orderType === 'market' || !price) {
        const currentPrice = await getCurrentPrice(coin);
        const slippage = 0.05;
        const slippagePrice = isBuy
          ? currentPrice * (1 + slippage)
          : currentPrice * (1 - slippage);
        
        console.log('Market order calculation:');
        console.log('  Current price:', currentPrice);
        console.log('  Slippage:', slippage);
        console.log('  Slippage price:', slippagePrice);
        
        finalPrice = formatPrice(slippagePrice, assetMeta.szDecimals || 5);
      } else {
        finalPrice = formatPrice(price, assetMeta.szDecimals || 5);
      }

      const orderData: any = {
        orders: [{
          a: assetIndex,
          b: isBuy,
          p: finalPrice,
          s: size.toString(),
          r: reduceOnly || false,
          t: orderType === 'limit'
            ? { limit: { tif: 'Gtc' } }
            : { limit: { tif: 'Ioc' } },
        }],
        grouping: 'na',
      };

      // Always use builder fee
      const BUILDER_ADDRESS = '0x7c4E42B6cDDcEfa029D230137908aB178D52d324';
      orderData.builder = {
        b: BUILDER_ADDRESS,
        f: 1, // 1 basis point = 0.01% fee
      };
      console.log('Using builder address:', BUILDER_ADDRESS, 'with fee:', 1);

      console.log('=== FINAL ORDER DATA ===');
      console.log(JSON.stringify(orderData, null, 2));
      
      try {
        result = await placeOrderAPI(
          { transport, wallet },
          orderData
        );
        console.log('=== ORDER SUCCESS ===');
        console.log('Result:', JSON.stringify(result));
      } catch (error: any) {
        console.error('=== ORDER ERROR ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        const errorMsg = error.message || String(error);
        
        if (errorMsg.includes('does not exist')) {
          throw new Error(
            `Wallet ${derivedAddress} is not registered on Hyperliquid testnet.`
          );
        }
        
        throw new Error(`Order failed: ${errorMsg}`);
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
      JSON.stringify({ success: true, data: result, walletAddress: derivedAddress }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('=== HANDLER ERROR ===');
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    const errorMessage = error.message || String(error);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
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