import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Wifi, WifiOff, Wallet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getAccountBalance } from '../../lib/hyperliquidApi';
import { getAddressFromPrivateKey } from '../../lib/walletUtils';
import { useHyperliquidPrice } from '../../hooks/useHyperliquidPrice';
import { OrderForm } from './OrderForm';
import { PositionsList } from './PositionsList';
import { OpenOrdersList } from './OpenOrdersList';
import { TradeHistoryList } from './TradeHistoryList';
import { AccountStats } from './AccountStats';
import type { Database } from '../../lib/database.types';

type TestAccount = Database['public']['Tables']['test_accounts']['Row'];

interface TradingInterfaceProps {
  accountId: string;
  onClose: () => void;
}

export function TradingInterface({ accountId, onClose }: TradingInterfaceProps) {
  const [account, setAccount] = useState<TestAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [hlBalance, setHlBalance] = useState<number>(0);
  const [hlAddress, setHlAddress] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const { price: currentPrice, priceChange, isConnected } = useHyperliquidPrice('BTC');

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  const loadAccount = async () => {
    const { data } = await supabase
      .from('test_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (data) {
      setAccount(data);
      await loadHyperliquidBalance(data.hl_api_private_key);
    }
    setLoading(false);
  };

  const loadHyperliquidBalance = async (privateKey: string | null) => {
    if (!privateKey) return;

    try {
      const address = getAddressFromPrivateKey(privateKey);
      setHlAddress(address);

      const balance = await getAccountBalance(address);
      setHlBalance(balance);

      console.log('Hyperliquid Trading Account:', address);
      console.log('Available Balance:', balance, 'USDC');
    } catch (error) {
      console.error('Error loading Hyperliquid balance:', error);
    }
  };

  if (loading || !account) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={onClose}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                {isConnected ? (
                  <Wifi className="w-5 h-5 text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
                <div className="text-center">
                  <div className="text-sm text-slate-400">BTC-PERP (Hyperliquid Testnet)</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-white">
                      ${currentPrice > 0 ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                    </span>
                    {priceChange !== 0 && (
                      <span className={`text-sm flex items-center ${
                        priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(priceChange).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hlAddress && (
          <div className="mb-6 bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wallet className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Hyperliquid Trading Account</h3>
                  <p className="text-sm text-slate-400 font-mono">{hlAddress}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Available Balance</div>
                <div className="text-2xl font-bold text-white">
                  ${hlBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Chart Placeholder</h3>
              <div className="bg-slate-900 rounded-lg h-96 flex items-center justify-center">
                <p className="text-slate-400">Live chart integration coming soon</p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex border-b border-slate-700 mb-4">
                <button
                  onClick={() => setActiveTab('positions')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'positions'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Positions
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'orders'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Open Orders
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Trade History
                </button>
              </div>

              {activeTab === 'positions' && hlAddress && (
                <PositionsList address={hlAddress} />
              )}
              {activeTab === 'orders' && hlAddress && (
                <OpenOrdersList
                  address={hlAddress}
                  privateKey={account?.hl_api_private_key || null}
                  builderCode={account?.hl_builder_code || null}
                  onOrderCancelled={loadHyperliquidBalance.bind(null, account?.hl_api_private_key || null)}
                />
              )}
              {activeTab === 'history' && hlAddress && (
                <TradeHistoryList address={hlAddress} />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <AccountStats account={account} />
            <OrderForm
              accountId={accountId}
              currentPrice={currentPrice}
              privateKey={account?.hl_api_private_key || null}
              builderCode={account?.hl_builder_code || null}
              onOrderPlaced={() => {
                loadAccount();
                loadHyperliquidBalance(account?.hl_api_private_key || null);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
