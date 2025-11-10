import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setUsers(data);
    setLoading(false);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.wallet_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const kycStatusConfig = {
    none: { color: 'gray', label: 'None', icon: AlertCircle },
    pending: { color: 'yellow', label: 'Pending', icon: AlertCircle },
    approved: { color: 'green', label: 'Approved', icon: CheckCircle },
    rejected: { color: 'red', label: 'Rejected', icon: XCircle },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email or wallet address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
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
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Wallet</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">KYC Status</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const kycConfig = kycStatusConfig[user.kyc_status as keyof typeof kycStatusConfig] || kycStatusConfig.none;
                const KycIcon = kycConfig.icon;

                return (
                  <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="py-3 px-4 text-white">{user.email || '—'}</td>
                    <td className="py-3 px-4 text-white font-mono text-sm">
                      {user.wallet_address ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-${kycConfig.color}-500/10 text-${kycConfig.color}-400`}>
                        <KycIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{kycConfig.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
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
