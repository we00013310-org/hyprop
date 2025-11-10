import { useState, useEffect } from 'react';
import { Activity, Pause, XCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type FundedAccount = Database['public']['Tables']['funded_accounts']['Row'] & {
  users?: { email: string | null };
};

export function AccountManagement() {
  const [accounts, setAccounts] = useState<FundedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('funded_accounts')
      .select('*, users(email)')
      .order('created_at', { ascending: false });

    if (data) setAccounts(data);
    setLoading(false);
  };

  const statusConfig = {
    active: { color: 'green', label: 'Active', icon: Activity },
    paused: { color: 'yellow', label: 'Paused', icon: Pause },
    failed: { color: 'red', label: 'Failed', icon: XCircle },
    closed: { color: 'gray', label: 'Closed', icon: CheckCircle },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Funded Accounts</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">User</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Symbol</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Balance</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Leverage</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const config = statusConfig[account.status as keyof typeof statusConfig];
                const StatusIcon = config.icon;

                return (
                  <tr key={account.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="py-3 px-4 text-white">{account.users?.email || '—'}</td>
                    <td className="py-3 px-4 text-white">{account.primary_symbol}</td>
                    <td className="py-3 px-4 text-white">${account.balance_actual.toFixed(2)}</td>
                    <td className="py-3 px-4 text-white">{account.l_user}x</td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-${config.color}-500/10 text-${config.color}-400`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(account.created_at).toLocaleDateString()}
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
