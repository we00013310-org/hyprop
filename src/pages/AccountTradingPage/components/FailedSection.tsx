import {
  AlertCircle,
  TrendingDown,
  XCircle,
  RefreshCw,
  Target,
  Calendar,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../../../components/ui";
import { TestAccount } from "@/types";

interface FailedSectionProps {
  account: TestAccount;
  onTryAgain?: () => void;
  isFundedAccount?: boolean;
}

const FailedSection = ({ account, onTryAgain }: FailedSectionProps) => {
  const profitLoss = account.virtual_balance - account.account_size;
  const profitPercent = ((profitLoss / account.account_size) * 100).toFixed(2);

  const reasons = [
    {
      icon: TrendingDown,
      label: "Drawdown Breach",
      value: account.dd_max > 0 ? "Max DD Exceeded" : "Daily Loss Limit",
      description: "Risk management limits were breached",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      icon: Target,
      label: "Profit Target",
      value: `$${Math.abs(account.profit_target).toLocaleString()}`,
      description:
        profitLoss >= 0 ? "Target not reached" : `${profitPercent}% loss`,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
    },
    {
      icon: XCircle,
      label: "Account Status",
      value: "Disabled",
      description: "Trading is now disabled",
      color: "text-gray-400",
      bgColor: "bg-gray-500/10",
      borderColor: "border-gray-500/20",
    },
  ];

  return (
    <div className="fade-in">
      {/* Failure Banner */}
      <div className="bg-linear-to-r from-red-500/20 via-rose-500/20 to-red-500/20 border border-red-500/30 rounded-2xl p-8 mb-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-3xl text-white">Evaluation Not Passed</h2>
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-red-400 text-lg mb-2">
              This account did not meet the evaluation requirements.
            </p>
            <p className="text-textBtn text-sm">
              The account breached one or more risk management limits. Review
              your trading strategy and try again with a new test account.
            </p>
          </div>
        </div>
      </div>

      {/* Reason Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {reasons.map((reason, index) => (
          <div
            key={index}
            className={`bg-sectionBg rounded-2xl border ${reason.borderColor} p-6 ${reason.bgColor} fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-3 rounded-xl bg-sectionBg border ${reason.borderColor}`}
              >
                <reason.icon className={`w-5 h-5 ${reason.color}`} />
              </div>
              <div className="flex-1">
                <div className="text-textBtn text-sm mb-1">{reason.label}</div>
                <div className={`text-2xl font-bold ${reason.color} mb-1`}>
                  {reason.value}
                </div>
                <div className="text-xs text-textBtn">{reason.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Account Details */}
      <div
        className="bg-sectionBg rounded-2xl border border-btnBorder p-6 mb-6 fade-in"
        style={{ animationDelay: "0.3s" }}
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-highlight" />
          Account Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-textBtn text-xs mb-1">Account Size</div>
            <div className="text-white text-lg font-medium">
              ${account.account_size.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-textBtn text-xs mb-1">Final Balance</div>
            <div className="text-red-400 text-lg font-medium">
              ${account.virtual_balance.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-textBtn text-xs mb-1">Account Mode</div>
            <div className="text-white text-lg font-medium">
              {account.account_mode.toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-textBtn text-xs mb-1">Status</div>
            <div className="text-red-400 text-lg font-medium flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              Failed
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div
        className="bg-sectionBg rounded-2xl border border-btnBorder p-6 fade-in"
        style={{ animationDelay: "0.4s" }}
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-highlight" />
          What's Next?
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-highlight/20 border border-highlight/30 flex items-center justify-center text-highlight text-sm font-bold">
              1
            </div>
            <div>
              <div className="text-white font-medium mb-1">
                Review Your Trades
              </div>
              <div className="text-textBtn text-sm">
                This account is now read-only. Analyze what went wrong and learn
                from your mistakes.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-highlight/20 border border-highlight/30 flex items-center justify-center text-highlight text-sm font-bold">
              2
            </div>
            <div>
              <div className="text-white font-medium mb-1">
                Refine Your Strategy
              </div>
              <div className="text-textBtn text-sm">
                Focus on risk management and discipline. Consider practicing
                more before the next attempt.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-highlight/20 border border-highlight/30 flex items-center justify-center text-highlight text-sm font-bold">
              3
            </div>
            <div>
              <div className="text-white font-medium mb-1">
                Start a New Evaluation
              </div>
              <div className="text-textBtn text-sm">
                When you're ready, purchase a new test account and apply what
                you've learned.
              </div>
            </div>
          </div>
        </div>

        {onTryAgain && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={onTryAgain}
              size="lg"
              rightIcon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FailedSection;
