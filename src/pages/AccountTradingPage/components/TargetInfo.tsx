import { AlertTriangle } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { FundedAccount, TestAccount } from "@/types";
import { useCheckpoints } from "@/hooks/account";

interface TargetInfoProps {
  account: TestAccount | FundedAccount;
}
const TargetInfo = ({ account }: TargetInfoProps) => {
  const isFundedAccount = !!(account as FundedAccount).test_account_id;
  const maxDDPercent = 0.1 * 100;
  const dailyDDPercent = 0.05 * 100;
  const ddValue = account.high_water_mark * 0.1;
  const dailyDDValue = account.account_size * 0.05;
  const { data: checkpoints } = useCheckpoints(account.id, isFundedAccount);

  // Get evaluation configuration
  const checkpointIntervalHours = account.checkpoint_interval_hours || 24;
  const profitTargetPercent = account.checkpoint_profit_target_percent || 8.0;
  const currentCheckpoint = account.current_checkpoint || 1;

  let nextRequiredBalance = 0;
  const previousCheckpoint = checkpoints?.find(
    (cp) => cp.checkpoint_number === currentCheckpoint - 1
  );
  const previousBalance = previousCheckpoint
    ? Number(previousCheckpoint.checkpoint_balance)
    : account.account_size;
  nextRequiredBalance = previousBalance * (1 + profitTargetPercent / 100);

  const createdAt = new Date(account.created_at);
  const now = new Date();
  const timeElapsed = now.getTime() - createdAt.getTime();
  const hoursElapsed = Math.ceil(timeElapsed / (1000 * 60 * 60));

  // Calculate next checkpoint time
  const nextCheckpointHour = currentCheckpoint * checkpointIntervalHours;
  const hoursRemaining = Math.max(0, nextCheckpointHour - hoursElapsed);

  if (account.status !== "active") {
    return null;
  }

  const profit = account.virtual_balance - previousBalance;
  const profitTarget = nextRequiredBalance - previousBalance;
  const progress = +((Math.max(profit, 0) * 100) / profitTarget).toFixed(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-end">
          <p className="text-sm text-textBtn">
            Profit Target {isFundedAccount ? "(daily)" : ""}
          </p>
          <p className="text-sm text-white">${profitTarget.toLocaleString()}</p>
        </div>
        <Progress key={progress} value={progress} />
        <div className="flex justify-between">
          <p className="text-xs text-textBtn">
            {`${hoursRemaining}h remaining`}
          </p>
          <p className="text-xs text-textBtn">{progress}% completed</p>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1 bg-linear-to-br from-tradingGreen/20 to-tradingGreen/5 border border-tradingGreen rounded-lg p-4 overflow-hidden flex items-end justify-between">
          <div className="absolute inset-0 bg-linear-to-br from-tradingGreen/10 to-transparent " />
          <div className="flex flex-col gap-1 h-full">
            <AlertTriangle className="w-5 h-5 text-tradingGreen mb-2" />
            <div className="text-white text-xl">
              ${ddValue.toLocaleString()} ({maxDDPercent.toFixed(1)}%)
            </div>
            <div className="text-tradingTextLight text-sm mt-1">
              Max Drawdown
            </div>
          </div>
          {/* <div className="flex flex-col gap-1 justify-end h-full">
          {isFundedAccount && (
            <>
              <div className="text-white text-xl text-right">
                {((account as FundedAccount).currentDD * 100.0).toFixed(1)}%
              </div>
              <div className="text-tradingTextLight text-sm mt-1 text-right">
                Current Drawdown
              </div>
            </>
          )}
        </div> */}
        </div>
        <div className="flex-1 relative bg-linear-to-br from-tradingGreen/20 to-tradingGreen/5 border border-tradingGreen rounded-lg p-4 overflow-hidden flex items-end justify-between">
          <div className="flex flex-col gap-1 h-full">
            <AlertTriangle className="w-5 h-5 text-tradingGreen mb-2" />
            <div className="text-white text-xl">
              ${dailyDDValue.toLocaleString()} ({dailyDDPercent.toFixed(1)}%)
            </div>
            <div className="text-tradingTextLight text-sm mt-1">
              Daily Drawdown
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetInfo;
