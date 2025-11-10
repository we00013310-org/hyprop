import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type TestAccount = Database['public']['Tables']['test_accounts']['Row'];

interface AccountStatsProps {
  account: TestAccount;
}

export function AccountStats({ account }: AccountStatsProps) {
  const profitLoss = account.virtual_balance - account.account_size;
  const profitLossPercent = (profitLoss / account.account_size) * 100;
  const isProfit = profitLoss >= 0;
  const progressPercent = (profitLoss / account.profit_target) * 100;

  const dailyDDRemaining = account.dd_daily;
  const maxDDRemaining = account.dd_max;
  const dailyDDPercent = (dailyDDRemaining / account.account_size) * 100;
  const maxDDPercent = (maxDDRemaining / account.account_size) * 100;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Account Stats</h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Account Size</span>
            <span className="text-white font-semibold">
              ${account.account_size.toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Current Balance</span>
            <span className="text-white font-semibold">
              ${account.virtual_balance.toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Profit/Loss</span>
            <span className={`font-semibold flex items-center space-x-1 ${
              isProfit ? 'text-green-400' : 'text-red-400'
            }`}>
              {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                {isProfit ? '+' : ''}${profitLoss.toLocaleString()} ({profitLossPercent.toFixed(2)}%)
              </span>
            </span>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Profit Target</span>
            <span className="text-white font-semibold">
              ${account.profit_target.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
            <div
              className={`h-2 rounded-full transition-all ${
                progressPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 text-right">
            {Math.max(progressPercent, 0).toFixed(1)}% Complete
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4 space-y-3">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Daily Drawdown</span>
            </div>
            <div className="text-lg font-bold text-white">
              ${dailyDDRemaining.toLocaleString()} ({dailyDDPercent.toFixed(1)}%)
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Max Drawdown</span>
            </div>
            <div className="text-lg font-bold text-white">
              ${maxDDRemaining.toLocaleString()} ({maxDDPercent.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
