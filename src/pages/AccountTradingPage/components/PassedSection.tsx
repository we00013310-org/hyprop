import {
  CheckCircle,
  TrendingUp,
  Trophy,
  ArrowRight,
  Target,
  Calendar,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { Button } from "../../../components/ui";
import { TestAccount } from "@/types";

interface PassedSectionProps {
  account: TestAccount;
  onClaimAccount?: () => void;
}

const PassedSection = ({ account, onClaimAccount }: PassedSectionProps) => {
  const profitLoss = account.virtual_balance - account.account_size;
  const profitPercent = ((profitLoss / account.account_size) * 100).toFixed(2);
  const targetPercent = (
    (account.profit_target / account.account_size) *
    100
  ).toFixed(0);

  const achievements = [
    {
      icon: Trophy,
      label: "Profit Target",
      value: `$${account.profit_target.toLocaleString()}`,
      description: `${targetPercent}% target reached`,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
    },
    {
      icon: TrendingUp,
      label: "Total Profit",
      value: `$${profitLoss.toLocaleString()}`,
      description: `+${profitPercent}% gain`,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      icon: Target,
      label: "Risk Management",
      value: "Excellent",
      description: "No limit breaches",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
  ];

  return (
    <div className="fade-in">
      {/* Success Banner */}
      <div className="bg-linear-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 border border-green-500/30 rounded-2xl p-8 mb-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-3xl text-white">Congratulations!</h2>
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-green-400 text-lg mb-2">
              You've successfully passed the evaluation!
            </p>
            <p className="text-textBtn text-sm">
              You met all requirements and demonstrated excellent trading
              discipline. Your test account is now eligible for conversion to a
              funded account.
            </p>
          </div>
        </div>
      </div>

      {/* Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {achievements.map((achievement, index) => (
          <div
            key={index}
            className={`bg-sectionBg rounded-2xl border ${achievement.borderColor} p-6 ${achievement.bgColor} fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-3 rounded-xl bg-sectionBg border ${achievement.borderColor}`}
              >
                <achievement.icon className={`w-5 h-5 ${achievement.color}`} />
              </div>
              <div className="flex-1">
                <div className="text-textBtn text-sm mb-1">
                  {achievement.label}
                </div>
                <div className={`text-2xl font-bold ${achievement.color} mb-1`}>
                  {achievement.value}
                </div>
                <div className="text-xs text-textBtn">
                  {achievement.description}
                </div>
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
            <div className="text-green-400 text-lg font-medium">
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
            <div className="text-green-400 text-lg font-medium flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Passed
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
                Review Your Performance
              </div>
              <div className="text-textBtn text-sm">
                Your test account is now read-only. Review your trades and
                strategies.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-highlight/20 border border-highlight/30 flex items-center justify-center text-highlight text-sm font-bold">
              2
            </div>
            <div>
              <div className="text-white font-medium mb-1">
                Check new Funded Account
              </div>
              <div className="text-textBtn text-sm">
                Go into your Dashboard and check new Funded Account.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-highlight/20 border border-highlight/30 flex items-center justify-center text-highlight text-sm font-bold">
              3
            </div>
            <div>
              <div className="text-white font-medium mb-1">
                Start Trading Live
              </div>
              <div className="text-textBtn text-sm">
                Trade with HyProp capital and earn up to 90% profit share.
              </div>
            </div>
          </div>
        </div>

        {onClaimAccount && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={onClaimAccount}
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Claim Funded Account
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassedSection;
