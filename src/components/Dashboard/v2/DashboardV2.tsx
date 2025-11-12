import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { LogOut, DollarSign, Settings, Wallet, Plus, TrendingUp } from "lucide-react";

import { useAuth } from "../../../contexts/AuthContext";
import { AccountSelection } from "../AccountSelection";
import { getBuilderFees } from "../../../lib/hyperliquidApi";
import { useAccounts } from "../../../hooks/useAccounts";
import { StatCard } from "./StatCard";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { AccountCard } from "./AccountCard";

import Logo from "../../Logo";

export function DashboardV2() {
    const [, setLocation] = useLocation();
    const { walletAddress, disconnectWallet } = useAuth();
    const [showAccountSelection, setShowAccountSelection] = useState(false);
    const { loadAccounts, testAccounts, fundedAccounts, loading } = useAccounts();
    const [builderFees, setBuilderFees] = useState<number>(0);
    const [loadingFees, setLoadingFees] = useState(true);

    useEffect(() => {
        if (walletAddress) {
            loadAccounts();
            loadBuilderFees();
        }
    }, [loadAccounts, walletAddress]);

    const loadBuilderFees = async () => {
        try {
            const BUILDER_ADDRESS = "0x7c4E42B6cDDcEfa029D230137908aB178D52d324";
            const fees = await getBuilderFees(BUILDER_ADDRESS);
            setBuilderFees(fees);
        } catch (error) {
            console.error("Error loading builder fees:", error);
        } finally {
            setLoadingFees(false);
        }
    };

    const handleDisconnect = () => {
        disconnectWallet();
    };

    // Calculate total stats
    const totalAccounts = testAccounts.length + fundedAccounts.length;
    const totalProfit = [...testAccounts, ...fundedAccounts].reduce((sum, account) => {
        if ('virtual_balance' in account) {
            return sum + (account.virtual_balance - account.account_size);
        } else {
            const startBalance = account.n_max / account.l_user;
            return sum + (account.balance_actual - startBalance);
        }
    }, 0);

    return (
        <div className="min-h-screen bg-[#0a0f1a]">
            {/* Navigation */}
            <nav className="bg-[#1a2332] border-b border-[#2a3647]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Logo />
                        <div className="flex items-center space-x-4">
                            {!!walletAddress && (
                                <div className="text-slate-300 text-sm font-mono bg-[#0f1824] px-4 py-2 rounded-xl border border-[#2a3647]">
                                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                </div>
                            )}
                            <button
                                onClick={() => setLocation("/demo")}
                                className="flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-[#2a3647] rounded-xl transition-all"
                                title="Demo Settings (Testing Only)"
                            >
                                <Settings className="w-5 h-5" />
                                <span className="hidden sm:inline">Demo</span>
                            </button>
                            <button
                                onClick={handleDisconnect}
                                className="flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-[#2a3647] rounded-xl transition-all"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="hidden sm:inline">Disconnect</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
                    <p className="text-slate-400">
                        Manage your trading accounts and monitor performance
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard
                                title="Rebate Collected"
                                value={loadingFees ? "..." : `$${builderFees.toFixed(4)}`}
                                currency="USDC"
                                icon={DollarSign}
                                iconClassName="text-emerald-400"
                            />
                            <StatCard
                                title="Total Accounts"
                                value={totalAccounts}
                                currency=""
                                icon={Wallet}
                                iconClassName="text-blue-400"
                            />
                            <StatCard
                                title="Total P&L"
                                value={`${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`}
                                currency=""
                                icon={TrendingUp}
                                iconClassName={totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}
                            />
                        </div>

                        {/* Funded Accounts Section */}
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-12 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">
                                            Funded Accounts
                                        </h3>
                                        <p className="text-sm text-emerald-400 mt-1">
                                            Real Money Trading • Live
                                        </p>
                                    </div>
                                </div>
                                {fundedAccounts.length > 0 && (
                                    <span className="text-slate-400 text-sm bg-[#1a2332] px-4 py-2 rounded-xl border border-[#2a3647]">
                                        {fundedAccounts.length} {fundedAccounts.length === 1 ? 'account' : 'accounts'}
                                    </span>
                                )}
                            </div>

                            {fundedAccounts.length === 0 ? (
                                <EmptyPlaceholder
                                    message="No funded accounts yet. Pass an evaluation to get funded!"
                                    icon={Wallet}
                                    iconClassName="text-emerald-600/50"
                                />
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {fundedAccounts.map((account) => (
                                        <AccountCard
                                            key={account.id}
                                            account={account}
                                            type="funded"
                                            onAccessAccount={() => setLocation(`/trading/${account.id}`)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Test Accounts Section */}
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-12 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">
                                            Evaluation Accounts
                                        </h3>
                                        <p className="text-sm text-blue-400 mt-1">
                                            Practice & Evaluation • Simulated
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAccountSelection(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>New Account</span>
                                </button>
                            </div>

                            {testAccounts.length === 0 ? (
                                <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-12 border border-slate-700/30">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                                            <Wallet className="w-10 h-10 text-blue-400" />
                                        </div>
                                        <h4 className="text-xl font-semibold text-white mb-2">
                                            Start Your Trading Journey
                                        </h4>
                                        <p className="text-slate-400 mb-6 max-w-md">
                                            Create your first evaluation account and begin trading. Pass the evaluation to unlock funded accounts.
                                        </p>
                                        <button
                                            onClick={() => setShowAccountSelection(true)}
                                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span>Begin Evaluation</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {testAccounts.map((account) => (
                                        <AccountCard
                                            key={account.id}
                                            account={account}
                                            type="exam"
                                            onAccessAccount={() => setLocation(`/trading/${account.id}`)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Account Selection Modal */}
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
