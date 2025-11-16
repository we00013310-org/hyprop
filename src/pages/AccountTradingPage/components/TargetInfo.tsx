import { AlertTriangle } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { TestAccount } from "@/types";

interface TargetInfoProps {
  account: TestAccount;
}
const TargetInfo = ({ account }: TargetInfoProps) => {
  const maxDDPercent = (account.dd_max / account.account_size) * 100;
  const profitTargetPercent = account.checkpoint_profit_target_percent || 8;
  const profitTaget = account.account_size * (profitTargetPercent / 100);
  const profit = account.virtual_balance - account.account_size;

  const progress = +((Math.max(profit, 0) * 100) / profitTaget).toFixed(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-end">
          <p className="text-sm text-textBtn">Profit Target</p>
          <p className="text-sm text-white">${profitTaget.toLocaleString()}</p>
        </div>
        <Progress value={progress} />
        <div className="flex justify-end">
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
