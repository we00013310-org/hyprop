import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type TestAccount = Database['public']['Tables']['test_accounts']['Row'];

interface TestAccountCardProps {
  account: TestAccount;
  onUpdate: () => void;
  onOpenTrading: () => void;
}

export function TestAccountCard({ account, onOpenTrading }: TestAccountCardProps) {
  const profitLoss = account.virtual_balance - account.account_size;
  const profitLossPercent = (profitLoss / account.account_size) * 100;
  const progressPercent = (profitLoss / account.profit_target) * 100;
  const isProfit = profitLoss >= 0;

  const statusConfig = {
    active: { color: 'blue', label: 'Active', icon: TrendingUp },
    passed: { color: 'green', label: 'Passed', icon: CheckCircle },
    failed: { color: 'red', label: 'Failed', icon: AlertCircle },
    expired: { color: 'gray', label: 'Expired', icon: AlertCircle },
  };

  const config = statusConfig[account.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-slate-400 mb-1">{account.account_mode.toUpperCase()}</div>
          <div className="text-2xl font-bold text-white">
            ${account.account_size.toLocaleString()}
          </div>
        </div>
        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full bg-${config.color}-500/10 text-${config.color}-400`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Current Balance</span>
          <span className="text-white font-semibold">
            ${account.virtual_balance.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">P&L</span>
          <span className={`font-semibold flex items-center space-x-1 ${
            isProfit ? 'text-green-400' : 'text-red-400'
          }`}>
            {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>
              {isProfit ? '+' : ''}${profitLoss.toLocaleString()} ({profitLossPercent.toFixed(2)}%)
            </span>
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Target</span>
          <span className="text-white font-semibold">
            ${account.profit_target.toLocaleString()}
          </span>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Progress</span>
            <span className="text-white font-semibold">
              {Math.min(progressPercent, 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                progressPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-slate-400 mb-1">Max DD</div>
          <div className="text-white font-semibold">${account.dd_max.toLocaleString()}</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-slate-400 mb-1">Daily DD</div>
          <div className="text-white font-semibold">${account.dd_daily.toLocaleString()}</div>
        </div>
      </div>

      {account.status === 'active' && (
        <button
          onClick={onOpenTrading}
          className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Open Trading
        </button>
      )}
    </div>
  );
}
