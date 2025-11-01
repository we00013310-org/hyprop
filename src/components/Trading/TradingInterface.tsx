import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useHyperliquidPrice } from '../../hooks/useHyperliquidPrice';
import { OrderForm } from './OrderForm';
import { PositionsList } from './PositionsList';
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
    }
    setLoading(false);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Chart Placeholder</h3>
              <div className="bg-slate-900 rounded-lg h-96 flex items-center justify-center">
                <p className="text-slate-400">Live chart integration coming soon</p>
              </div>
            </div>

            <PositionsList accountId={accountId} />
          </div>

          <div className="space-y-6">
            <AccountStats account={account} />
            <OrderForm
              accountId={accountId}
              currentPrice={currentPrice}
              onOrderPlaced={loadAccount}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
