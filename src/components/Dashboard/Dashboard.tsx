import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { AccountSelection } from './AccountSelection';
import { TestAccountCard } from './TestAccountCard';
import { FundedAccountCard } from './FundedAccountCard';
import { LogOut, TrendingUp, DollarSign } from 'lucide-react';
import { getBuilderFees } from '../../lib/hyperliquidApi';
import type { Database } from '../../lib/database.types';

type TestAccount = Database['public']['Tables']['test_accounts']['Row'];
type FundedAccount = Database['public']['Tables']['funded_accounts']['Row'];

interface DashboardProps {
  onOpenTrading: (accountId: string) => void;
}

export function Dashboard({ onOpenTrading }: DashboardProps) {
  const { user, walletAddress, disconnectWallet } = useAuth();
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([]);
  const [fundedAccounts, setFundedAccounts] = useState<FundedAccount[]>([]);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [builderFees, setBuilderFees] = useState<number>(0);
  const [loadingFees, setLoadingFees] = useState(true);

  useEffect(() => {
    loadAccounts();
    loadBuilderFees();
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;

    try {
      const [testResult, fundedResult] = await Promise.all([
        supabase
          .from('test_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('funded_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (testResult.data) setTestAccounts(testResult.data);
      if (fundedResult.data) setFundedAccounts(fundedResult.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBuilderFees = async () => {
    try {
      const BUILDER_ADDRESS = '0x7c4E42B6cDDcEfa029D230137908aB178D52d324';
      const fees = await getBuilderFees(BUILDER_ADDRESS);
      setBuilderFees(fees);
    } catch (error) {
      console.error('Error loading builder fees:', error);
    } finally {
      setLoadingFees(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white">HyProp</h1>
            </div>
            <div className="flex items-center space-x-4">
              {walletAddress && (
                <div className="text-slate-300 text-sm font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </div>
              )}
              <button
                onClick={handleDisconnect}
                className="flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
              <p className="text-slate-400">Manage your trading accounts and evaluations</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center space-x-2 mb-1">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-slate-400 text-sm font-medium">Builder Fees Collected</span>
              </div>
              {loadingFees ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                  <span className="text-slate-500 text-sm">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-white">
                  ${builderFees.toFixed(4)} <span className="text-sm font-normal text-slate-400">USDC</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Funded Accounts</h3>
              </div>
              {fundedAccounts.length === 0 ? (
                <div className="bg-slate-800 rounded-xl p-8 text-center">
                  <p className="text-slate-400">No funded accounts yet. Pass an evaluation to get funded!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {fundedAccounts.map((account) => (
                    <FundedAccountCard key={account.id} account={account} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Test Accounts</h3>
                <button
                  onClick={() => setShowAccountSelection(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  New Evaluation
                </button>
              </div>
              {testAccounts.length === 0 ? (
                <div className="bg-slate-800 rounded-xl p-8 text-center">
                  <p className="text-slate-400 mb-4">No test accounts yet. Start your trading journey!</p>
                  <button
                    onClick={() => setShowAccountSelection(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Begin Evaluation
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {testAccounts.map((account) => (
                    <TestAccountCard
                      key={account.id}
                      account={account}
                      onUpdate={loadAccounts}
                      onOpenTrading={() => onOpenTrading(account.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showAccountSelection && (
        <AccountSelection
          onClose={() => setShowAccountSelection(false)}
          onSuccess={() => {
            setShowAccountSelection(false);
            loadAccounts();
          }}
        />
      )}
    </div>
  );
}
