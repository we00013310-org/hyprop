import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Wallet } from 'npm:ethers@6';
import { HttpTransport } from 'npm:@nktkas/hyperliquid@0.25.7';
import { order as placeOrderAPI, cancel as cancelAPI, approveBuilderFee as approveBuilderFeeAPI } from 'npm:@nktkas/hyperliquid@0.25.7/api/exchange';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, x-client-info, apikey, x-wallet-address',
  'Access-Control-Max-Age': '86400',
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

async function getExchangeInfo(): Promise<any> {
  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'exchange' }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch exchange info: ${response.statusText}`);
  }

  return await response.json();
}

function formatPrice(price: number, tickSize: number): string {
  // Round to nearest tick size
  const rounded = Math.round(price / tickSize) * tickSize;
  
  // Count decimal places needed for tick size
  // e.g., tickSize 0.1 needs 1 decimal, tickSize 0.01 needs 2 decimals
  const tickSizeStr = tickSize.toString();
  const decimalPlaces = tickSizeStr.includes('.') 
    ? tickSizeStr.split('.')[1].length 
    : 0;
  
  const formatted = rounded.toFixed(decimalPlaces);
  console.log(`Formatted price ${price} with tickSize ${tickSize} -> rounded: ${rounded} -> formatted: ${formatted}`);
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

async function getMaxBuilderFee(userAddress: string, builderAddress: string): Promise<number> {
  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'maxBuilderFee',
      user: userAddress,
      builder: builderAddress,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch max builder fee: ${response.statusText}`);
  }

  const maxFee = await response.json();
  console.log(`Max builder fee for ${userAddress} / ${builderAddress}: ${maxFee}`);
  return maxFee;
}

async function getBuilderReferralState(builderAddress: string): Promise<any> {
  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'referral',
      user: builderAddress,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch referral state: ${response.statusText}`);
  }

  const state = await response.json();
  console.log(`Referral state for ${builderAddress}:`, JSON.stringify(state));
  return state;
}

async function getAccountValue(address: string): Promise<number> {
  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'clearinghouseState',
      user: address,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch account value: ${response.statusText}`);
  }

  const state = await response.json();
  const accountValue = parseFloat(state.marginSummary?.accountValue || '0');
  console.log(`Account value for ${address}: ${accountValue} USDC`);
  return accountValue;
}

// Get real-world BTC price from CoinGecko (oracle)
async function getRealOraclePrice(coin: string): Promise<number> {
  // For BTC, use CoinGecko
  if (coin === 'BTC') {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      const data = await response.json();
      const price = data.bitcoin?.usd;

      if (!price || typeof price !== 'number') {
        throw new Error('Invalid price data from CoinGecko');
      }

      return price;
    } catch (error) {
      console.warn('CoinGecko failed, trying Binance fallback:', error);
      
      // Fallback to Binance
      try {
        const response = await fetch(
          'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          }
        );

        if (!response.ok) {
          throw new Error(`Binance API error: ${response.statusText}`);
        }

        const data = await response.json();
        const price = parseFloat(data.price);

        if (!price || isNaN(price)) {
          throw new Error('Invalid price data from Binance');
        }

        return price;
      } catch (binanceError) {
        console.error('Both price sources failed:', binanceError);
        // Last resort: use Hyperliquid testnet price
        return await getCurrentPrice(coin);
      }
    }
  }
  
  // For other coins, use Hyperliquid price as fallback
  return await getCurrentPrice(coin);
}

// Calculate PnL using real-world price
function calculateRealWorldPNL(
  entryPrice: number,
  currentPrice: number,
  size: number
): number {
  if (size === 0) return 0;

  const isLong = size > 0;
  const absSize = Math.abs(size);

  if (isLong) {
    // Long: profit when price goes up
    return (currentPrice - entryPrice) * absSize;
  } else {
    // Short: profit when price goes down
    return (entryPrice - currentPrice) * absSize;
  }
}

// Simulate position for test account (Phase 1)
async function simulatePosition(
  supabase: any,
  testAccountId: string,
  coin: string,
  isBuy: boolean,
  size: number,
  entryPrice: number,
  reduceOnly: boolean
): Promise<any> {
  console.log('=== SIMULATING POSITION FOR TEST ACCOUNT ===');
  console.log('Test Account ID:', testAccountId);
  console.log('Coin:', coin);
  console.log('Side:', isBuy ? 'BUY' : 'SELL');
  console.log('Size:', size);
  console.log('Entry Price:', entryPrice);
  console.log('Reduce Only:', reduceOnly);

  // Get current position if exists
  const { data: existingPosition } = await supabase
    .from('test_positions')
    .select('*')
    .eq('test_account_id', testAccountId)
    .eq('symbol', coin)
    .maybeSingle();

  // Get test account info
  const { data: testAccount } = await supabase
    .from('test_accounts')
    .select('*')
    .eq('id', testAccountId)
    .single();

  if (!testAccount) {
    throw new Error('Test account not found');
  }

  // Calculate margin used (simplified: assume 10x leverage for now)
  const leverage = 10;
  const notional = size * entryPrice;
  const marginUsed = notional / leverage;

  // Calculate trading fee (0.03% taker fee)
  const feeRate = 0.0003;
  const tradingFee = notional * feeRate;

  let newPosition: any;
  let realizedPnL = 0;

  if (existingPosition) {
    // Update existing position
    const existingSize = parseFloat(existingPosition.size.toString());
    const existingEntry = parseFloat(existingPosition.avg_entry.toString());
    const existingSide = existingPosition.side;
    
    // Determine if we're closing/reducing the position
    const isClosing = reduceOnly || 
      (existingSide === 'long' && !isBuy) || 
      (existingSide === 'short' && isBuy);
    
    // Calculate new size
    let newSize: number;
    if (isClosing) {
      // Closing: reduce position size
      if (existingSide === 'long') {
        // Long position: sell to close
        newSize = existingSize - size;
      } else {
        // Short position: buy to close (size is positive, so subtract)
        newSize = existingSize + size; // existingSize is negative, adding positive size reduces it
      }
    } else {
      // Adding to position or reversing
      if (existingSide === 'long' && isBuy) {
        // Adding to long position (both positive)
        newSize = existingSize + size;
      } else if (existingSide === 'short' && !isBuy) {
        // Adding to short position (both negative, so subtract to make more negative)
        newSize = existingSize - size;
      } else {
        // Reversing position - calculate based on direction
        if (isBuy) {
          newSize = existingSize + size; // Buying adds to size
        } else {
          newSize = existingSize - size; // Selling subtracts from size
        }
      }
    }
    
    const newSide = newSize > 0 ? 'long' : newSize < 0 ? 'short' : existingSide;

    if (isClosing) {
      // Closing or reversing position
      const closeSize = Math.min(Math.abs(existingSize), size);
      const closePrice = entryPrice;
      
      if (existingSide === 'long') {
        realizedPnL = (closePrice - existingEntry) * closeSize;
      } else {
        realizedPnL = (existingEntry - closePrice) * closeSize;
      }
      
      // Deduct trading fee
      realizedPnL -= tradingFee;

      if (Math.abs(newSize) < 0.0001) {
        // Position fully closed
        await supabase
          .from('test_positions')
          .delete()
          .eq('id', existingPosition.id);
        
        newPosition = null;
      } else {
        // Position partially closed or reversed
        const newEntry = newSize > 0 ? entryPrice : entryPrice;
        
        // Get current oracle price to calculate new UPNL
        const currentOraclePrice = await getRealOraclePrice(coin);
        const newUpnl = calculateRealWorldPNL(newEntry, currentOraclePrice, newSize);
        
        await supabase
          .from('test_positions')
          .update({
            size: newSize,
            side: newSide,
            avg_entry: newEntry,
            margin_used: Math.abs(newSize) * newEntry / leverage,
            upnl: newUpnl,
            rpnl: (parseFloat(existingPosition.rpnl.toString()) || 0) + realizedPnL,
            fees_accrued: (parseFloat(existingPosition.fees_accrued.toString()) || 0) + tradingFee,
            last_update_ts: new Date().toISOString(),
          })
          .eq('id', existingPosition.id);
        
        const { data: updated } = await supabase
          .from('test_positions')
          .select('*')
          .eq('id', existingPosition.id)
          .single();
        
        newPosition = updated;
      }
    } else {
      // Adding to position
      const totalNotional = (existingSize * existingEntry) + (size * entryPrice);
      const newEntry = totalNotional / newSize;
      
      // Get current oracle price to calculate new UPNL
      const currentOraclePrice = await getRealOraclePrice(coin);
      const newUpnl = calculateRealWorldPNL(newEntry, currentOraclePrice, newSize);
      
      await supabase
        .from('test_positions')
        .update({
          size: newSize,
          avg_entry: newEntry,
          margin_used: Math.abs(newSize) * newEntry / leverage,
          upnl: newUpnl,
          fees_accrued: (parseFloat(existingPosition.fees_accrued.toString()) || 0) + tradingFee,
          last_update_ts: new Date().toISOString(),
        })
        .eq('id', existingPosition.id);
      
      const { data: updated } = await supabase
        .from('test_positions')
        .select('*')
        .eq('id', existingPosition.id)
        .single();
      
      newPosition = updated;
    }
  } else {
    // Opening new position
    if (reduceOnly) {
      throw new Error('Cannot reduce only: no existing position');
    }

    const side = isBuy ? 'long' : 'short';
    const signedSize = isBuy ? size : -size;
    
    // Get current oracle price to calculate initial UPNL
    const currentOraclePrice = await getRealOraclePrice(coin);
    const initialUpnl = calculateRealWorldPNL(entryPrice, currentOraclePrice, signedSize);
    
    const { data: newPos } = await supabase
      .from('test_positions')
      .insert({
        test_account_id: testAccountId,
        symbol: coin,
        side,
        size: signedSize,
        avg_entry: entryPrice,
        margin_used: marginUsed,
        upnl: initialUpnl,
        rpnl: 0,
        fees_accrued: tradingFee,
      })
      .select()
      .single();
    
    newPosition = newPos;
  }

  // Update test account virtual balance
  // Note: realizedPnL already has trading fee deducted for closed positions
  // For new positions, we need to deduct the trading fee
  let newBalance: number;
  if (existingPosition && (Math.abs(newSize) < 0.0001 || newPosition === null)) {
    // Position was closed, realizedPnL already includes fee deduction
    newBalance = testAccount.virtual_balance + realizedPnL;
  } else {
    // Opening new position or modifying existing, deduct trading fee
    newBalance = testAccount.virtual_balance + realizedPnL - tradingFee;
  }
  
  const newHighWaterMark = Math.max(testAccount.high_water_mark || testAccount.account_size, newBalance);
  
  await supabase
    .from('test_accounts')
    .update({
      virtual_balance: newBalance,
      high_water_mark: newHighWaterMark,
      updated_at: new Date().toISOString(),
    })
    .eq('id', testAccountId);

  console.log('=== POSITION SIMULATED SUCCESSFULLY ===');
  console.log('Realized PnL:', realizedPnL);
  console.log('Trading Fee:', tradingFee);
  console.log('New Balance:', newBalance);

  return {
    success: true,
    position: newPosition,
    realizedPnL,
    tradingFee,
    newBalance,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
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
      .select('hl_key, hl_builder_code, status')
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

    // Check if account is active before allowing trading operations
    // Allow viewing positions/PnL updates even for disabled accounts, but block new orders
    if (action.type === 'placeOrder') {
      if (account.status !== 'active') {
        throw new Error(
          `Trading is disabled for this account. Status: ${account.status}. ` +
          `Accounts that have passed or failed cannot place new orders, but you can still view positions and history.`
        );
      }
    }

    // PHASE 1: For test accounts, hl_key is optional since we're not placing real orders
    // Only require it for actions that actually need it (like approveBuilderFee)
    let wallet: Wallet | null = null;
    let derivedAddress: string | null = null;
    let transport: HttpTransport | null = null;

    if (account.hl_key) {
      // Trim and validate private key format
      const trimmedKey = account.hl_key.trim();
      
      if (!trimmedKey.startsWith('0x')) {
        throw new Error('Invalid private key format. Must start with 0x.');
      }
      
      if (trimmedKey.length !== 66) {
        throw new Error(`Invalid private key format. Must be 66 characters long (got ${trimmedKey.length}).`);
      }

      wallet = new Wallet(trimmedKey);
      derivedAddress = wallet.address;
      console.log('Wallet address:', derivedAddress);
      
      transport = new HttpTransport({
        isTestnet: true,
      });
    } else {
      console.log('No hl_key configured - using Phase 1 simulated trading');
    }

    let result;

    if (action.type === 'approveBuilderFee') {
      if (!wallet || !transport || !derivedAddress) {
        throw new Error('Hyperliquid API key required for builder fee approval. This is only needed for funded accounts.');
      }

      const BUILDER_ADDRESS = '0x7c4E42B6cDDcEfa029D230137908aB178D52d324';

      console.log('=== APPROVING BUILDER FEE ===');
      console.log('Wallet address:', derivedAddress);
      console.log('Builder address:', BUILDER_ADDRESS);
      console.log('Max fee rate: 0.1%');

      try {
        const currentApproval = await getMaxBuilderFee(derivedAddress, BUILDER_ADDRESS);
        console.log('Current approval BEFORE:', currentApproval, '(tenths of basis points)');

        console.log('Calling approveBuilderFeeAPI...');
        result = await approveBuilderFeeAPI(
          { transport, wallet },
          {
            maxFeeRate: '0.1%',
            builder: BUILDER_ADDRESS,
          }
        );
        console.log('=== BUILDER FEE APPROVAL API RESPONSE ===');
        console.log('Full result:', JSON.stringify(result, null, 2));
        console.log('Result type:', typeof result);
        console.log('Result keys:', result ? Object.keys(result) : 'null/undefined');

        if (result?.response?.type === 'error') {
          console.error('Approval returned error:', result.response.payload);
          throw new Error(`Approval failed: ${result.response.payload}`);
        }

        console.log('Waiting 2 seconds for blockchain to process...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const newApproval = await getMaxBuilderFee(derivedAddress, BUILDER_ADDRESS);
        console.log('New approval AFTER:', newApproval, '(tenths of basis points)');

        if (newApproval === 0 || newApproval < 100) {
          console.error('WARNING: Approval did not persist! Still less than 100 (0.1%)');
          throw new Error('Builder fee approval did not persist. Try again.');
        }

        console.log('=== BUILDER FEE APPROVAL SUCCESS ===');
        console.log(`Approved ${newApproval} tenths of basis points (${newApproval / 10000}%)`);

      } catch (error: any) {
        console.error('=== BUILDER FEE APPROVAL ERROR ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
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
      
      // PHASE 1: For test accounts, simulate positions instead of placing real orders
      console.log('=== PHASE 1: SIMULATING POSITION FOR TEST ACCOUNT ===');
      
      // Determine entry price
      let entryPrice: number;
      
      if (orderType === 'market' || !price) {
        // For market orders, use real oracle price
        entryPrice = await getRealOraclePrice(coin);
        console.log('Market order: Using oracle price:', entryPrice);
      } else {
        // For limit orders, use the specified price
        entryPrice = parseFloat(price);
        console.log('Limit order: Using specified price:', entryPrice);
      }

      // Simulate the position
      const simulationResult = await simulatePosition(
        supabase,
        accountId,
        coin,
        isBuy,
        parseFloat(size),
        entryPrice,
        reduceOnly || false
      );
      
      console.log('=== SIMULATED ORDER SUCCESS ===');
      console.log('Result:', JSON.stringify(simulationResult));
      
      // Return format compatible with OrderForm expectations
      // The OrderForm checks for result.status === 'ok'
      result = {
        status: 'ok',
        response: {
          type: 'order',
          data: simulationResult,
        },
        message: 'Order simulated successfully (Phase 1)',
      };
    } else if (action.type === 'cancelOrder') {
      // PHASE 1: Test accounts don't have real orders to cancel
      console.log('=== CANCEL ORDER: Phase 1 - No real orders to cancel ===');
      result = { status: 'ok', message: 'No orders to cancel in Phase 1 (simulated trading)' };
    } else if (action.type === 'cancelAllOrders') {
      // PHASE 1: Test accounts don't have real orders to cancel
      console.log('=== CANCEL ALL ORDERS: Phase 1 - No real orders to cancel ===');
      result = { status: 'ok', message: 'No orders to cancel in Phase 1 (simulated trading)' };
    } else if (action.type === 'getBuilderFees') {
      const BUILDER_ADDRESS = '0x7c4E42B6cDDcEfa029D230137908aB178D52d324';

      console.log('=== QUERYING BUILDER FEES ===');
      console.log('Builder address:', BUILDER_ADDRESS);

      const referralState = await getBuilderReferralState(BUILDER_ADDRESS);
      const builderAccountValue = await getAccountValue(BUILDER_ADDRESS);

      result = {
        builderAddress: BUILDER_ADDRESS,
        accountValue: builderAccountValue,
        referralState: referralState,
        meetsMinimum: builderAccountValue >= 100,
      };

      console.log('Builder fees result:', JSON.stringify(result, null, 2));
    } else if (action.type === 'getTestPositions') {
      // PHASE 1: Get positions from database for test account
      console.log('=== GETTING TEST POSITIONS ===');
      
      const { data: positions, error: positionsError } = await supabase
        .from('test_positions')
        .select('*')
        .eq('test_account_id', accountId)
        .order('created_at', { ascending: false });

      if (positionsError) {
        throw new Error(`Failed to fetch positions: ${positionsError.message}`);
      }

      // Update PnL for each position using current oracle prices
      const updatedPositions = await Promise.all(
        (positions || []).map(async (pos: any) => {
          const currentPrice = await getRealOraclePrice(pos.symbol);
          const size = parseFloat(pos.size.toString());
          const entryPrice = parseFloat(pos.avg_entry.toString());
          const upnl = calculateRealWorldPNL(entryPrice, currentPrice, size);
          
          // Update position in database
          await supabase
            .from('test_positions')
            .update({
              upnl,
              last_update_ts: new Date().toISOString(),
            })
            .eq('id', pos.id);

          // Format response similar to Hyperliquid API format
          return {
            position: {
              coin: pos.symbol,
              szi: pos.size.toString(),
              entryPx: pos.avg_entry.toString(),
              marginUsed: pos.margin_used.toString(),
              unrealizedPnl: upnl.toString(),
            },
          };
        })
      );

      result = updatedPositions;
    } else if (action.type === 'updatePositionPnL') {
      // PHASE 1: Update position PnL and check for auto-close
      console.log('=== UPDATING POSITION PNL ===');
      
      const { data: positions } = await supabase
        .from('test_positions')
        .select('*')
        .eq('test_account_id', accountId);

      if (!positions || positions.length === 0) {
        result = { updated: 0, closed: 0 };
        return;
      }

      const { data: testAccount } = await supabase
        .from('test_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (!testAccount) {
        throw new Error('Test account not found');
      }

      let updated = 0;
      let closed = 0;

      for (const pos of positions) {
        const currentPrice = await getRealOraclePrice(pos.symbol);
        const size = parseFloat(pos.size.toString());
        const entryPrice = parseFloat(pos.avg_entry.toString());
        const marginUsed = parseFloat(pos.margin_used.toString());
        
        const upnl = calculateRealWorldPNL(entryPrice, currentPrice, size);
        const pnlPercentage = marginUsed > 0 ? (upnl / marginUsed) * 100 : 0;

        // Update position PnL
        await supabase
          .from('test_positions')
          .update({
            upnl,
            last_update_ts: new Date().toISOString(),
          })
          .eq('id', pos.id);

        updated++;

        // Check if loss > 5% and auto-close
        if (pnlPercentage < -5) {
          console.log(`Auto-closing position ${pos.symbol}: Loss ${pnlPercentage.toFixed(2)}%`);
          
          // Close position by setting size to 0 (or delete)
          const closePrice = currentPrice;
          const closeSize = Math.abs(size);
          
          let realizedPnL = 0;
          if (pos.side === 'long') {
            realizedPnL = (closePrice - entryPrice) * closeSize;
          } else {
            realizedPnL = (entryPrice - closePrice) * closeSize;
          }
          
          // Deduct trading fee
          const feeRate = 0.0003;
          const tradingFee = closeSize * closePrice * feeRate;
          realizedPnL -= tradingFee;

          // Delete position
          await supabase
            .from('test_positions')
            .delete()
            .eq('id', pos.id);

          // Update test account balance
          const newBalance = testAccount.virtual_balance + realizedPnL;
          await supabase
            .from('test_accounts')
            .update({
              virtual_balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq('id', accountId);

          closed++;
        }
      }

      result = { updated, closed };
    } else if (action.type === 'checkTestStatus') {
      // PHASE 1: Check if test passes (1 day elapsed, >8% profit, no loss limit hit)
      console.log('=== CHECKING TEST STATUS ===');
      
      const { data: testAccount } = await supabase
        .from('test_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (!testAccount) {
        throw new Error('Test account not found');
      }

      const createdAt = new Date(testAccount.created_at);
      const now = new Date();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const timeElapsed = now.getTime() - createdAt.getTime();
      const oneDayElapsed = timeElapsed >= oneDayInMs;

      const profit = testAccount.virtual_balance - testAccount.account_size;
      const profitPercent = (profit / testAccount.account_size) * 100;
      const profitTargetMet = profitPercent >= 8;

      // Check if loss limit was hit (virtual_balance dropped below account_size * (1 - dd_max/100))
      const lossLimit = testAccount.account_size * (1 - testAccount.dd_max / 100);
      const lossLimitHit = testAccount.virtual_balance < lossLimit;

      let newStatus = testAccount.status;
      let shouldPass = false;

      if (testAccount.status === 'active') {
        if (lossLimitHit) {
          newStatus = 'failed';
          await supabase
            .from('test_accounts')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', accountId);
        } else if (oneDayElapsed && profitTargetMet) {
          newStatus = 'passed';
          shouldPass = true;
          await supabase
            .from('test_accounts')
            .update({
              status: 'passed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', accountId);
        }
      }

      result = {
        status: newStatus,
        oneDayElapsed,
        profitPercent: profitPercent.toFixed(2),
        profitTargetMet,
        lossLimitHit,
        shouldPass,
        createdAt: testAccount.created_at,
        timeElapsed: Math.floor(timeElapsed / 1000 / 60 / 60), // hours
      };
    } else {
      throw new Error('Invalid action type');
    }

    return new Response(
      JSON.stringify({ success: true, data: result, walletAddress: derivedAddress || null }),
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
