import { useState } from "react";
import { DollarSign, Users, Gift } from "lucide-react";
import { Button } from "../../components/ui";
import StatCard from "@/components/StatCard/StatCard";

interface Referral {
  address: string;
  dateJoined: string;
  tradeVolume: number;
  earnFee: number;
  yourRewards: number;
}

type TabType = "Referrals" | "Legacy Reward History";

export default function ReferralsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Referrals");

  // Demo data matching the screenshot
  const stats = {
    tradersReferred: 12,
    revenuesEarned: 8020,
    claimableRewards: 602,
  };

  // Demo referrals data
  const referrals: Referral[] = [
    {
      address: "0x1234...5678",
      dateJoined: "2024-11-01",
      tradeVolume: 125000,
      earnFee: 250,
      yourRewards: 125,
    },
    {
      address: "0xabcd...ef01",
      dateJoined: "2024-10-28",
      tradeVolume: 89000,
      earnFee: 178,
      yourRewards: 89,
    },
    {
      address: "0x9876...5432",
      dateJoined: "2024-10-25",
      tradeVolume: 156000,
      earnFee: 312,
      yourRewards: 156,
    },
    {
      address: "0x2468...1357",
      dateJoined: "2024-10-20",
      tradeVolume: 67000,
      earnFee: 134,
      yourRewards: 67,
    },
    {
      address: "0xfedc...ba98",
      dateJoined: "2024-10-15",
      tradeVolume: 98000,
      earnFee: 196,
      yourRewards: 98,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatWalletAddress = (address: string) => {
    return address;
  };

  return (
    <div>
      <main className="fade-in max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-20 flex flex-col gap-10 items-start text-left">
        <div className="w-full">
          {/* Header + Actions (title and buttons share a row, each half width on md+) */}
          <div>
            <div className="mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="w-full md:w-1/2">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Referrals
                  </h1>
                  <p className="text-slate-400">
                    Refer users to earn rewards.{" "}
                    <a
                      href="#"
                      className="text-primary hover:text-primary-hover underline"
                    >
                      Learn more
                    </a>
                  </p>
                </div>

                <div className="w-full md:w-1/2 flex items-center md:justify-end gap-4">
                  <Button className="w-40" variant="outline" size="lg">
                    Enter Code
                  </Button>
                  <Button className="w-40" variant="outline" size="lg">
                    Create Code
                  </Button>
                  <Button className="w-40" size="lg">
                    Claim Rewards
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Traders Referred */}
            <StatCard
              title="Traders Referred"
              value={"$" + stats.tradersReferred}
              icon={<Users className="w-5 h-5 text-highlight" />}
              showHelp
            />

            {/* Revenues Earned */}
            <StatCard
              title="Revenues Earned"
              value={"$" + stats.revenuesEarned}
              icon={<DollarSign className="w-5 h-5 text-highlight" />}
              showHelp
            />

            {/* Claimable Rewards */}
            <StatCard
              title="Claimable Rewards"
              value={"$" + stats.claimableRewards}
              icon={<Gift className="w-5 h-5 text-highlight" />}
              showHelp
            />
          </div>
          {/* Tabs and Table */}
          <div className="bg-sectionBg rounded-lg border border-btnBorder overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-btnBorder">
              <button
                onClick={() => setActiveTab("Referrals")}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "Referrals"
                    ? "text-white border-b-2 border-primary"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Referrals
              </button>
              <button
                onClick={() => setActiveTab("Legacy Reward History")}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "Legacy Reward History"
                    ? "text-white border-b-2 border-primary"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Legacy Reward History
              </button>
            </div>

            {/* Table Content */}
            {activeTab === "Referrals" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-btnBorder">
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">
                        Address <span className="text-slate-600">▼</span>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">
                        Date Joined <span className="text-slate-600">▼</span>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">
                        Trade Volume <span className="text-slate-600">▼</span>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">
                        Earn Fee <span className="text-slate-600">▼</span>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">
                        Your Rewards <span className="text-slate-600">▼</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((referral, index) => (
                      <tr
                        key={index}
                        className="border-b border-btnBorder hover:bg-cardBgDark transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-white font-mono text-sm">
                            {formatWalletAddress(referral.address)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-400 text-sm">
                            {referral.dateJoined}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">
                            {formatCurrency(referral.tradeVolume)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">
                            {formatCurrency(referral.earnFee)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">
                            {formatCurrency(referral.yourRewards)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "Legacy Reward History" && (
              <div className="px-6 py-20 text-center">
                <p className="text-slate-400">
                  No legacy reward history available
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
