import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface AccountSelectionProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ACCOUNT_TIERS = {
  '1-step': [
    { size: 5000, fee: 60, target: 500, dailyLoss: 0.04, maxDD: 300 },
    { size: 10000, fee: 110, target: 1000, dailyLoss: 0.04, maxDD: 600 },
    { size: 25000, fee: 275, target: 2500, dailyLoss: 0.04, maxDD: 1500 },
    { size: 50000, fee: 495, target: 5000, dailyLoss: 0.04, maxDD: 3000 },
    { size: 100000, fee: 999, target: 10000, dailyLoss: 0.04, maxDD: 6000 },
  ],
  '2-step': [
    { size: 5000, fee: 50, target: 500, dailyLoss: 0.05, maxDD: 400 },
    { size: 10000, fee: 100, target: 1000, dailyLoss: 0.05, maxDD: 800 },
    { size: 25000, fee: 250, target: 2500, dailyLoss: 0.05, maxDD: 2000 },
    { size: 50000, fee: 450, target: 5000, dailyLoss: 0.05, maxDD: 4000 },
    { size: 100000, fee: 725, target: 10000, dailyLoss: 0.05, maxDD: 8000 },
  ],
};

export function AccountSelection({ onClose, onSuccess }: AccountSelectionProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'1-step' | '2-step'>('1-step');
  const [selectedTier, setSelectedTier] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tier = ACCOUNT_TIERS[mode][selectedTier];

  const handlePurchase = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('test_accounts').insert({
        user_id: user.id,
        account_size: tier.size,
        account_mode: mode,
        fee_paid: tier.fee,
        virtual_balance: tier.size,
        dd_max: tier.maxDD,
        dd_daily: tier.size * tier.dailyLoss,
        profit_target: tier.target,
        high_water_mark: tier.size,
        status: 'active',
      });

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create test account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Select Evaluation Account</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setMode('1-step')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === '1-step'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              1-Step Evaluation (Static Drawdown)
            </button>
            <button
              onClick={() => setMode('2-step')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === '2-step'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              2-Step Evaluation (Trailing Drawdown)
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ACCOUNT_TIERS[mode].map((t, index) => (
              <button
                key={index}
                onClick={() => setSelectedTier(index)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTier === index
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="text-2xl font-bold text-white mb-2">
                  ${t.size.toLocaleString()}
                </div>
                <div className="text-sm text-slate-300 space-y-1">
                  <div>Fee: ${t.fee}</div>
                  <div>Target: ${t.target.toLocaleString()}</div>
                  <div>Daily Loss: {(t.dailyLoss * 100).toFixed(0)}%</div>
                  <div>Max DD: ${t.maxDD.toLocaleString()}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-slate-700 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Selected Account Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Account Size</div>
                <div className="text-white font-semibold">${tier.size.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-400">Evaluation Fee</div>
                <div className="text-white font-semibold">${tier.fee} USDC</div>
              </div>
              <div>
                <div className="text-slate-400">Profit Target</div>
                <div className="text-white font-semibold">${tier.target.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-400">Max Daily Loss</div>
                <div className="text-white font-semibold">{(tier.dailyLoss * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-slate-400">Max Drawdown</div>
                <div className="text-white font-semibold">${tier.maxDD.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-400">Drawdown Type</div>
                <div className="text-white font-semibold">{mode === '1-step' ? 'Static' : 'Trailing'}</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : `Purchase Evaluation - $${tier.fee} USDC`}
          </button>
        </div>
      </div>
    </div>
  );
}
