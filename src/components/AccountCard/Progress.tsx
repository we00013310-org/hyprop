import { Checkpoint, TestAccount } from "@/types";
import { AlertCircle, CheckCircle, Clock, Target } from "lucide-react";

import { Progress as ProgressBar } from "@/components/ui/progress";

interface ProgressProps {
  account: TestAccount;
  checkpoints: Checkpoint[];
  isDisabled: boolean;
  isFundedAccount: boolean;
}

const Progress = ({
  account,
  checkpoints,
  isDisabled,
  isFundedAccount = false,
}: ProgressProps) => {
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

  // Calculate required balance for current checkpoint
  let nextRequiredBalance = 0;
  const previousCheckpoint = checkpoints?.find(
    (cp) => cp.checkpoint_number === currentCheckpoint - 1
  );
  const previousBalance = previousCheckpoint
    ? Number(previousCheckpoint.checkpoint_balance)
    : account.account_size;
  nextRequiredBalance = previousBalance * (1 + profitTargetPercent / 100);

  const meetsCurrentRequirement =
    account.virtual_balance >= nextRequiredBalance;

  if (account.status !== "active") {
    return null;
  }

  if (numCheckpoints === 1 || isFundedAccount) {
    const profit = account.virtual_balance - previousBalance;
    const profitTarget = nextRequiredBalance - previousBalance;
    const progress = +((Math.max(profit, 0) * 100) / profitTarget).toFixed(0);

    return (
      <div className="">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-textBtn">
            Profit Target {isFundedAccount ? "(Daily)" : ""}
          </span>
          <span className={` ${isDisabled ? "text-slate-500" : "text-white"}`}>
            ${profitTarget.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-textBtn">Progress</span>
          <span className={` ${isDisabled ? "text-slate-500" : "text-white"}`}>
            {progress}%
          </span>
        </div>
        <ProgressBar value={progress} />
      </div>
    );
  }

  return (
    account.status === "active" && (
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
            const checkpoint = checkpoints?.find(
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
                meetsCurrentRequirement ? "text-green-400" : "text-slate-300"
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
    )
  );
};

export default Progress;
