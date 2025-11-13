import { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  MoveUpRight,
  MoveDownRight,
} from "lucide-react";

import Tag from "../ui/Tag";
import { Button } from "../ui";
import CardTag from "../ui/CardTag";

import type { Database } from "../../lib/database.types";
import { supabase } from "../../lib/supabase";

type TestAccount = Database["public"]["Tables"]["test_accounts"]["Row"];
type Checkpoint =
  Database["public"]["Tables"]["test_account_checkpoints"]["Row"];

interface AccountCardProps {
  account: TestAccount;
  onUpdate: () => void;
  onOpenTrading: () => void;
}

export function AccountCard({ account, onOpenTrading }: AccountCardProps) {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

  const profitLoss = account.virtual_balance - account.account_size;
  const profitLossPercent = (profitLoss / account.account_size) * 100;
  const progressPercent = (profitLoss / account.profit_target) * 100;
  const isProfit = profitLoss >= 0;

  // Get evaluation configuration
  const numCheckpoints = account.num_checkpoints || 3;
  const checkpointIntervalHours = account.checkpoint_interval_hours || 24;
  const profitTargetPercent = account.checkpoint_profit_target_percent || 8.0;

  // Calculate time elapsed and remaining
  const createdAt = new Date(account.created_at);
  const now = new Date();
  const timeElapsed = now.getTime() - createdAt.getTime();
  const hoursElapsed = Math.ceil(timeElapsed / (1000 * 60 * 60));
  const currentCheckpoint = account.current_checkpoint || 1;

  // Calculate next checkpoint time
  const nextCheckpointHour = currentCheckpoint * checkpointIntervalHours;
  const hoursRemaining = Math.max(0, nextCheckpointHour - hoursElapsed);

  // Load checkpoints from database
  useEffect(() => {
    async function loadCheckpoints() {
      const { data } = await supabase
        .from("test_account_checkpoints")
        .select("*")
        .eq("test_account_id", account.id)
        .order("checkpoint_number", { ascending: true });

      if (data) {
        setCheckpoints(data);
      }
    }

    if (account.status === "active") {
      loadCheckpoints();
    }
  }, [account.id, account.status]);

  // Calculate required balance for current checkpoint
  let nextRequiredBalance = 0;
  if (currentCheckpoint === 1) {
    nextRequiredBalance =
      account.account_size * (1 + profitTargetPercent / 100);
  } else {
    const previousCheckpoint = checkpoints.find(
      (cp) => cp.checkpoint_number === currentCheckpoint - 1
    );
    const previousBalance = previousCheckpoint
      ? Number(previousCheckpoint.checkpoint_balance)
      : account.account_size;
    nextRequiredBalance = previousBalance * (1 + profitTargetPercent / 100);
  }

  const meetsCurrentRequirement =
    account.virtual_balance >= nextRequiredBalance;

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
      onClick={onOpenTrading}
      className={`fade-in cursor-pointer bg-cardBg rounded-2xl p-3 border-[0.6px] border-cardBorder transition-all ${
        isDisabled
          ? "border-slate-600 opacity-50 hover:opacity-90"
          : "border-blue-500/20 hover:scale-105"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <CardTag
            text="Exam Account"
            className="top-[-0.75rem] left-[-0.75rem]"
          />
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
              isProfit ? "text-green" : "text-red-400"
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

        {/* Dynamic Checkpoint Evaluation Progress */}
        {account.status === "active" && (
          <div className="bg-cardBgDark rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-textBtn" />
                <span className="text-xs font-medium text-textBtn">
                  Checkpoint {currentCheckpoint} of {numCheckpoints}
                </span>
              </div>
              <span className="text-xs text-textBtn">
                {`${hoursRemaining}h remaining`}
              </span>
            </div>

            {/* Dynamic Checkpoint Status */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: numCheckpoints }, (_, i) => {
                const checkpointNum = i + 1;
                const checkpoint = checkpoints.find(
                  (cp) => cp.checkpoint_number === checkpointNum
                );

                return (
                  <div key={checkpointNum} className="flex items-center flex-1">
                    <div className="flex-1 flex items-center justify-center">
                      {checkpoint?.checkpoint_passed === true ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : checkpoint?.checkpoint_passed === false ? (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      ) : currentCheckpoint === checkpointNum ? (
                        <div
                          className={`w-5 h-5 rounded-full border-2 ${
                            meetsCurrentRequirement
                              ? "border-green-400 bg-green-400/20"
                              : "border-blue-400 bg-blue-400/20"
                          }`}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
                      )}
                    </div>
                    {checkpointNum < numCheckpoints && (
                      <div className="flex-1 h-0.5 bg-slate-600 mx-1" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next Checkpoint Requirement */}
            {currentCheckpoint <= numCheckpoints && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400">
                    Checkpoint {currentCheckpoint} Target ({profitTargetPercent}
                    %):
                  </span>
                </div>
                <span
                  className={`font-semibold ${
                    meetsCurrentRequirement
                      ? "text-green-400"
                      : "text-slate-300"
                  }`}
                >
                  $
                  {nextRequiredBalance.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                  {meetsCurrentRequirement ? " ✓" : ""}
                </span>
              </div>
            )}
          </div>
        )}
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
