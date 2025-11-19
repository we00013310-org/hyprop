import { AlertTriangle } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { FundedAccount, TestAccount } from "@/types";
import { useCheckpoints } from "@/hooks/account";

interface TargetInfoProps {
  account: TestAccount | FundedAccount;
}
const TargetInfo = ({ account }: TargetInfoProps) => {
  const isFundedAccount = !!(account as FundedAccount).test_account_id;
  const maxDDPercent = (account.dd_max / account.account_size) * 100;
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
      <div className="relative bg-linear-to-br from-tradingGreen/20 to-tradingGreen/5 border border-tradingGreen rounded-lg p-4 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-tradingGreen/10 to-transparent" />
        <div className="relative z-10">
          <AlertTriangle className="w-5 h-5 text-tradingGreen mb-2" />
          <div className="text-white text-xl">
            ${account.dd_max.toLocaleString()} ({maxDDPercent.toFixed(1)}%)
          </div>
          <div className="text-tradingTextLight text-sm mt-1">Max Drawdown</div>
        </div>
      </div>
    </div>
  );
};

export default TargetInfo;
