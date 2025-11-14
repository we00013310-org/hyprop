import { useState } from "react";
import { DollarSign, Users, Gift } from "lucide-react";
import { Button } from "../ui";

interface Referral {
  address: string;
  dateJoined: string;
  tradeVolume: number;
  earnFee: number;
  yourRewards: number;
}

type TabType = "Referrals" | "Legacy Reward History";

export function ReferralsPage() {
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

  const handleEnterCode = () => {
    // Placeholder for enter code functionality
    console.log("Enter referral code clicked");
  };

  const handleCreateCode = () => {
    // Placeholder for create code functionality
    console.log("Create referral code clicked");
  };

  const handleClaimRewards = () => {
    // Placeholder for claim rewards functionality
    console.log("Claim rewards clicked");
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
                  <Button variant="outline" onClick={handleEnterCode}>
                    Enter Code
                  </Button>
                  <Button variant="outline" onClick={handleCreateCode}>
                    Create Code
                  </Button>
                  <Button variant="primary" onClick={handleClaimRewards}>
                    Claim Rewards
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Traders Referred */}
            <div className="bg-sectionBg border border-btnBorder rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <span className="text-slate-400 text-sm">Traders Referred</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {stats.tradersReferred}
              </div>
            </div>

            {/* Revenues Earned */}
            <div className="bg-sectionBg border border-btnBorder rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <span className="text-slate-400 text-sm">Revenues Earned</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {formatCurrency(stats.revenuesEarned)}
              </div>
            </div>

            {/* Claimable Rewards */}
            <div className="bg-sectionBg border border-btnBorder rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <span className="text-slate-400 text-sm">
                  Claimable Rewards
                </span>
              </div>
              <div className="text-3xl font-bold text-white">
                {formatCurrency(stats.claimableRewards)}
              </div>
            </div>
          </div>
          {/* Tabs and Table */}
          <div className="bg-sectionBg rounded-lg border border-btnBorder overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-btnBorder">
              <button
                onClick={() => setActiveTab("Referrals")}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "Referrals"
                    ? "text-white border-b-2 border-primary"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Referrals
              </button>
              <button
                onClick={() => setActiveTab("Legacy Reward History")}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
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
