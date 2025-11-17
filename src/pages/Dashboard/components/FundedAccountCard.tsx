import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle,
  Wallet,
} from "lucide-react";

import { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

type FundedAccount = Database["public"]["Tables"]["funded_accounts"]["Row"];
type Position = Database["public"]["Tables"]["positions"]["Row"];

interface FundedAccountCardProps {
  account: FundedAccount;
}

export function FundedAccountCard({ account }: FundedAccountCardProps) {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    loadPositions();
  }, [account.id]);

  const loadPositions = async () => {
    const { data } = await supabase
      .from("positions")
      .select("*")
      .eq("account_id", account.id);

    if (data) setPositions(data);
  };

  const totalUpnl = positions.reduce((sum, p) => sum + p.upnl, 0);
  const totalRpnl = positions.reduce((sum, p) => sum + p.rpnl, 0);
  const equity = account.balance_actual + totalUpnl;

  const statusConfig = {
    active: { color: "green", label: "Active", icon: Activity },
    paused: { color: "yellow", label: "Paused", icon: AlertCircle },
    failed: { color: "red", label: "Failed", icon: AlertCircle },
    closed: { color: "gray", label: "Closed", icon: AlertCircle },
  };

  const config = statusConfig[account.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-green-500/20 hover:border-green-500/40 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Wallet className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">
              FUNDED ACCOUNT
            </span>
          </div>
          <div className="text-2xl font-bold text-white">
            ${(account.n_max / account.l_user).toLocaleString()}
          </div>
        </div>
        <div
          className={`flex items-center space-x-1 px-3 py-1 rounded-full bg-${config.color}-500/10 text-${config.color}-400`}
        >
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Virtual Balance</span>
          <span className="text-white font-semibold">
            ${(account.n_max / account.l_user).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Equity</span>
          <span className="text-white font-semibold">${equity.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Unrealized P&L</span>
          <span
            className={`font-semibold ${
              totalUpnl >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {totalUpnl >= 0 ? "+" : ""}${totalUpnl.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Realized P&L</span>
          <span
            className={`font-semibold ${
              totalRpnl >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {totalRpnl >= 0 ? "+" : ""}${totalRpnl.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Leverage</span>
          <span className="text-white font-semibold">{account.l_user}x</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Primary Market</span>
          <span className="text-white font-semibold">
            {account.primary_symbol}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-slate-400 mb-1">Max DD</div>
          <div className="text-white font-semibold">
            ${account.dd_max.toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-slate-400 mb-1">Daily DD</div>
          <div className="text-white font-semibold">
            ${account.dd_daily.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <button className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2">
          <TrendingUp className="w-4 h-4" />
          <span>Trade</span>
        </button>
        <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2">
          <DollarSign className="w-4 h-4" />
          <span>Withdraw</span>
        </button>
      </div>
    </div>
  );
}
