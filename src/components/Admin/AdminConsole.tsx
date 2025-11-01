import { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UserManagement } from './UserManagement';
import { AccountManagement } from './AccountManagement';
import { PayoutManagement } from './PayoutManagement';
import { SystemSettings } from './SystemSettings';

export function AdminConsole() {
  const [activeTab, setActiveTab] = useState<'users' | 'accounts' | 'payouts' | 'settings'>('users');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTestAccounts: 0,
    activeFundedAccounts: 0,
    totalCapitalDeployed: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [usersResult, testAccountsResult, fundedAccountsResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('test_accounts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('funded_accounts').select('balance_actual').eq('status', 'active'),
    ]);

    const totalCapital = fundedAccountsResult.data?.reduce((sum, acc) => sum + acc.balance_actual, 0) || 0;

    setStats({
      totalUsers: usersResult.count || 0,
      activeTestAccounts: testAccountsResult.count || 0,
      activeFundedAccounts: fundedAccountsResult.data?.length || 0,
      totalCapitalDeployed: totalCapital,
    });
  };

  const tabs = [
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'accounts' as const, label: 'Accounts', icon: TrendingUp },
    { id: 'payouts' as const, label: 'Payouts', icon: DollarSign },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white">Admin Console</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Users</span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Test Accounts</span>
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.activeTestAccounts}</div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Funded Accounts</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.activeFundedAccounts}</div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Capital Deployed</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              ${stats.totalCapitalDeployed.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex border-b border-slate-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 flex items-center justify-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'accounts' && <AccountManagement />}
            {activeTab === 'payouts' && <PayoutManagement />}
            {activeTab === 'settings' && <SystemSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
