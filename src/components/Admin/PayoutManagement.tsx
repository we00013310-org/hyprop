import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Payout = Database['public']['Tables']['payouts']['Row'] & {
  funded_accounts?: {
    users?: { email: string | null };
  };
};

export function PayoutManagement() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    const { data } = await supabase
      .from('payouts')
      .select('*, funded_accounts(users(email))')
      .order('created_at', { ascending: false });

    if (data) setPayouts(data);
    setLoading(false);
  };

  const statusConfig = {
    pending: { color: 'yellow', label: 'Pending', icon: Clock },
    paid: { color: 'blue', label: 'Paid', icon: DollarSign },
    failed: { color: 'red', label: 'Failed', icon: XCircle },
    completed: { color: 'green', label: 'Completed', icon: CheckCircle },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Payout History</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No payouts yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">User</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Period</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Gross Profit</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Trader Amount</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">HyProp Amount</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => {
                const config = statusConfig[payout.status as keyof typeof statusConfig];
                const StatusIcon = config.icon;

                return (
                  <tr key={payout.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="py-3 px-4 text-white">
                      {payout.funded_accounts?.users?.email || '—'}
                    </td>
                    <td className="py-3 px-4 text-white text-sm">
                      {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-white">${payout.gross_profit.toFixed(2)}</td>
                    <td className="py-3 px-4 text-green-400">${payout.trader_amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-blue-400">${payout.hyprop_amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-${config.color}-500/10 text-${config.color}-400`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
