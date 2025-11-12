import { TrendingUp, TrendingDown } from "lucide-react";
import type { Database } from "../../../lib/database.types";

type TestAccount = Database["public"]["Tables"]["test_accounts"]["Row"];
type FundedAccount = Database["public"]["Tables"]["funded_accounts"]["Row"];

interface AccountCardProps {
    account: TestAccount | FundedAccount;
    type: "exam" | "funded";
    onAccessAccount: () => void;
}

export function AccountCard({ account, type, onAccessAccount }: AccountCardProps) {
    const isExam = type === "exam";
    const isFunded = type === "funded";

    // Common calculations
    let currentBalance = 0;
    let startingBalance = 0;
    let targetBalance = 0;
    let profitLoss = 0;
    let profitLossPercent = 0;
    let progressPercent = 0;
    let maxDrawdown = 0;
    let dailyDrawdown = 0;
    let displayName = "";

    if (isExam) {
        const testAccount = account as TestAccount;
        currentBalance = testAccount.virtual_balance;
        startingBalance = testAccount.account_size;
        targetBalance = testAccount.profit_target + startingBalance;
        profitLoss = currentBalance - startingBalance;
        profitLossPercent = (profitLoss / startingBalance) * 100;
        progressPercent = (profitLoss / testAccount.profit_target) * 100;
        maxDrawdown = testAccount.dd_max;
        dailyDrawdown = testAccount.dd_daily;
        displayName = `${testAccount.account_mode} Account`;
    } else {
        const fundedAccount = account as FundedAccount;
        currentBalance = fundedAccount.balance_actual;
        startingBalance = fundedAccount.n_max / fundedAccount.l_user;
        targetBalance = startingBalance;
        profitLoss = currentBalance - startingBalance;
        profitLossPercent = (profitLoss / startingBalance) * 100;
        progressPercent = 0; // Funded accounts don't have progress targets
        maxDrawdown = fundedAccount.dd_max;
        dailyDrawdown = fundedAccount.dd_daily;
        displayName = "Funded Account";
    }

    const isProfit = profitLoss >= 0;
    const isActive = account.status === "active";

    return (
        <div
            className={`relative bg-[#1a2332] rounded-2xl p-6 border transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 ${isFunded
                ? "border-emerald-500/40 hover:border-emerald-400/60 shadow-emerald-500/10"
                : "border-[#2a3647] hover:border-[#3a4657]"
                }`}
        >
            {/* Top Badge Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-transparent via-current to-transparent"
                style={{
                    color: isFunded ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)'
                }}
            />

            {/* Header */}
            <div className="flex justify-between items-start mb-5">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${isFunded
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-blue-500/10 text-blue-400"
                                }`}
                        >
                            {displayName}
                        </span>
                    </div>
                    <div className="text-4xl font-bold text-white tracking-tight">
                        ${currentBalance.toFixed(2)}
                    </div>
                </div>

                {/* Status Badge */}
                <div
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border ${isActive
                        ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-500/5 text-slate-400 border-slate-500/30"
                        }`}
                >
                    <div
                        className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                            }`}
                    />
                    <span>{isActive ? "Active" : "Inactive"}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#0f1824] rounded-xl p-3 border border-[#1a2332]">
                    <div className="text-xs text-slate-500 mb-1.5 font-medium">Starting Balance</div>
                    <div className="text-lg font-bold text-white">
                        ${startingBalance.toFixed(2)}
                    </div>
                </div>

                <div className="bg-[#0f1824] rounded-xl p-3 border border-[#1a2332]">
                    <div className="text-xs text-slate-500 mb-1.5 font-medium">P&L</div>
                    <div
                        className={`text-lg font-bold flex items-center gap-1 ${isProfit ? "text-emerald-400" : "text-red-400"
                            }`}
                    >
                        {isProfit ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{isProfit ? "+" : ""}${profitLoss.toFixed(2)}</span>
                    </div>
                    <div className={`text-xs font-medium ${isProfit ? "text-emerald-400/70" : "text-red-400/70"}`}>
                        {profitLossPercent.toFixed(2)}%
                    </div>
                </div>

                {isExam && (
                    <div className="bg-[#0f1824] rounded-xl p-3 border border-[#1a2332]">
                        <div className="text-xs text-slate-500 mb-1.5 font-medium">Target</div>
                        <div className="text-lg font-bold text-white">
                            ${targetBalance.toFixed(2)}
                        </div>
                    </div>
                )}

                {isExam && (
                    <div className="bg-[#0f1824] rounded-xl p-3 border border-[#1a2332]">
                        <div className="text-xs text-slate-500 mb-1.5 font-medium">Progress</div>
                        <div className="text-lg font-bold text-blue-400">
                            {Math.max(0, progressPercent).toFixed(1)}%
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Bar (Exam only) */}
            {isExam && (
                <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-500 font-medium">Evaluation Progress</span>
                        <span className="text-xs text-blue-400 font-bold">{Math.min(100, Math.max(0, progressPercent)).toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 bg-[#0f1824] rounded-full overflow-hidden border border-[#1a2332]">
                        <div
                            className={`h-full transition-all duration-500 ${progressPercent >= 100
                                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                : progressPercent > 0
                                    ? "bg-gradient-to-r from-blue-600 to-blue-400"
                                    : "bg-slate-700"
                                }`}
                            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Drawdown Limits */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#0f1824] rounded-xl p-3 border border-[#1a2332]">
                    <div className="text-xs text-slate-500 mb-1.5 font-medium">Max DD</div>
                    <div className="text-lg font-bold text-red-400">
                        ${maxDrawdown.toFixed(2)}
                    </div>
                </div>
                <div className="bg-[#0f1824] rounded-xl p-3 border border-[#1a2332]">
                    <div className="text-xs text-slate-500 mb-1.5 font-medium">Daily DD</div>
                    <div className="text-lg font-bold text-orange-400">
                        ${dailyDrawdown.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Access Button */}
            <button
                onClick={onAccessAccount}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl active:scale-[0.98] ${isFunded
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white"
                    : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white"
                    }`}
            >
                Access Account
            </button>
        </div>
    );
}
