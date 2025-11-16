import {
  AlertCircle,
  CheckCircle,
  MoveUpRight,
  MoveDownRight,
} from "lucide-react";

import Tag from "../ui/Tag";
import { Button } from "../ui";
import CardTag from "../ui/CardTag";

import { useCheckpoints } from "@/hooks/testAccount";
import { TestAccount } from "@/types";
import Progress from "./Progress";

interface AccountCardProps {
  account: TestAccount;
  onUpdate: () => void;
  onOpenTrading: () => void;
}

export function AccountCard({ account, onOpenTrading }: AccountCardProps) {
  const { data: checkpoints } = useCheckpoints(account.id);

  const profitLoss = account.virtual_balance - account.account_size;
  const profitLossPercent = (profitLoss / account.account_size) * 100;
  // const progressPercent = (profitLoss / account.profit_target) * 100;
  const isProfit = profitLoss >= 0;

  const statusConfig = {
    active: { color: "active", label: "Active", icon: MoveUpRight },
    passed: { color: "green", label: "Passed", icon: CheckCircle },
    failed: { color: "red", label: "Failed", icon: AlertCircle },
    expired: { color: "gray", label: "Expired", icon: AlertCircle },
  };

  const config = statusConfig[account.status as keyof typeof statusConfig];
  const isDisabled = account.status !== "active";
  const isPassed = account.status === "passed";
  // const isFailed = account.status === 'failed';

  return (
    <div
      onClick={!isDisabled ? onOpenTrading : undefined}
      className={`fade-in bg-cardBg rounded-2xl p-3 border-[0.6px] border-cardBorder transition-all ${
        isDisabled
          ? "border-slate-600 opacity-50 hover:opacity-90"
          : "border-blue-500/20 hover:scale-105 cursor-pointer"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <CardTag text="Exam Account" className="-top-3 -left-3" />
          <div className="text-xs text-slate-400 mb-1">
            {account.account_mode.toUpperCase()}
          </div>
          <div
            className={`text-2xl font-bold ${
              isDisabled ? "text-slate-500" : "text-white"
            }`}
          >
            ${account.account_size.toLocaleString()}
          </div>
          {isDisabled && (
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  isPassed
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {isPassed ? "✓ Test Completed" : "✗ Trading Disabled"}
              </span>
            </div>
          )}
        </div>
        <Tag label={config.label} color={config.color} icon={config.icon} />
      </div>

      <div className="space-y-3 mb-4">
        {isDisabled && (
          <div
            className={`mb-3 p-3 rounded-lg border ${
              isPassed
                ? "bg-green-500/10 border-green-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                isPassed ? "text-green-400" : "text-red-400"
              }`}
            >
              {isPassed
                ? "✓ You passed the evaluation! This account is now read-only."
                : "✗ This account has reached its limit. Trading is disabled."}
            </p>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-textBtn">Current Balance</span>
          <span className={` ${isDisabled ? "text-slate-500" : "text-white"}`}>
            ${account.virtual_balance.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-textBtn">P&L</span>
          <span
            className={`flex items-center space-x-1 ${
              isProfit ? "text-tagGreenText" : "text-red-400"
            }`}
          >
            {isProfit ? (
              <MoveUpRight className="w-4 h-4" />
            ) : (
              <MoveDownRight className="w-4 h-4" />
            )}
            <span>
              {isProfit ? "+" : ""}${profitLoss.toLocaleString()} (
              {profitLossPercent.toFixed(2)}%)
            </span>
          </span>
        </div>

        <Progress
          account={account}
          checkpoints={checkpoints || []}
          isDisabled={isDisabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-cardBgDark rounded-lg p-3">
          <div className="text-textBtn text-sm mb-1">Max DD</div>
          <div className="text-white text-xl font-medium">
            ${account.dd_max.toLocaleString()}
          </div>
        </div>
        <div className="bg-cardBgDark rounded-lg p-3">
          <div className="text-textBtn text-sm mb-1">Daily Loss</div>
          <div className="text-white text-xl font-medium">
            ${account.dd_daily.toLocaleString()}
          </div>
        </div>
      </div>

      {account.status === "active" ? (
        <div className="mt-4">
          <Button fullWidth onClick={onOpenTrading}>
            Access Account
          </Button>
        </div>
      ) : null}
    </div>
  );
}
