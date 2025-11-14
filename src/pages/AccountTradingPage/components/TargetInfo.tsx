import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

const TargetInfo = () => {
  const progress = 66;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-end">
          <p className="text-sm text-textBtn">Profit Target</p>
          <p className="text-sm text-white">$10,000</p>
        </div>
        <Progress value={progress} />
        <div className="flex justify-end">
          <p className="text-xs text-textBtn">{progress}% completed</p>
        </div>
      </div>
      <div className="relative bg-gradient-to-br from-tradingGreen/20 to-tradingGreen/5 border border-tradingGreen rounded-lg p-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-tradingGreen/10 to-transparent" />
        <div className="relative z-10">
          <AlertTriangle className="w-5 h-5 text-tradingGreen mb-2" />
          <div className="text-white text-xl">$400 (4.0%)</div>
          <div className="text-tradingTextLight text-sm mt-1">Max Drawdown</div>
        </div>
      </div>
    </div>
  );
};

export default TargetInfo;
