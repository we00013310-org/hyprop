import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
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
            className={`bg-gradient-to-br ${isFunded
                    ? "from-emerald-900/20 to-slate-800"
                    : "from-slate-800 to-slate-900"
                } rounded-xl p-6 border ${isFunded
                    ? "border-emerald-500/30 hover:border-emerald-500/50"
                    : "border-slate-700/50 hover:border-slate-600/50"
                } transition-all duration-200 hover:shadow-xl`}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className={`text-xs font-semibold uppercase tracking-wider ${isFunded ? "text-emerald-400" : "text-blue-400"
                                }`}
                        >
                            {displayName}
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        ${currentBalance.toFixed(2)}
                    </div>
                </div>

                {/* Status Badge */}
                <div
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-500/10 text-slate-400"
                        }`}
                >
                    <div
                        className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-slate-400"
                            }`}
                    />
                    <span>{isActive ? "Active" : "Inactive"}</span>
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <div className="text-xs text-slate-400 mb-1">Current Balance</div>
                    <div className="text-base font-semibold text-white">
                        ${startingBalance.toFixed(2)}
                    </div>
                </div>

                <div>
                    <div className="text-xs text-slate-400 mb-1">P&L</div>
                    <div
                        className={`text-base font-semibold flex items-center gap-1 ${isProfit ? "text-emerald-400" : "text-red-400"
                            }`}
                    >
                        {isProfit ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        {isProfit ? "+" : ""}${profitLoss.toFixed(2)} ({profitLossPercent.toFixed(2)}%)
                    </div>
                </div>

                {isExam && (
                    <div>
                        <div className="text-xs text-slate-400 mb-1">Target</div>
                        <div className="text-base font-semibold text-white">
                            ${targetBalance.toFixed(2)}
                        </div>
                    </div>
                )}

                {isExam && (
                    <div>
                        <div className="text-xs text-slate-400 mb-1">Progress</div>
                        <div className="text-base font-semibold text-white">
                            {Math.max(0, progressPercent).toFixed(2)}%
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Bar (Exam only) */}
            {isExam && (
                <div className="mb-4">
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${progressPercent >= 100
                                    ? "bg-emerald-400"
                                    : progressPercent > 0
                                        ? "bg-blue-400"
                                        : "bg-slate-600"
                                }`}
                            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Drawdown Limits */}
            <div className="grid grid-cols-2 gap-4 mb-5 text-xs">
                <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-slate-400 mb-1">MAD DD</div>
                    <div className="text-white font-semibold">
                        ${maxDrawdown.toFixed(2)}
                    </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-slate-400 mb-1">DAILY DD</div>
                    <div className="text-white font-semibold">
                        ${dailyDrawdown.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Access Button */}
            <button
                onClick={onAccessAccount}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${isFunded
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-white"
                    }`}
            >
                Access Account
            </button>
        </div>
    );
}
