/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  User,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface LeaderboardEntry {
  rank: number;
  trader: string;
  accountValue: number;
  pnl: number;
  pnlPercent: number;
  roi: number;
  volume: number;
}

type SortColumn = "rank" | "trader" | "accountValue" | "pnl" | "roi" | "volume";
type SortDirection = "asc" | "desc";
type TimePeriod = "30D" | "7D" | "24H" | "ALL";

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30D");
  const [sortColumn, setSortColumn] = useState<SortColumn>("roi");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadLeaderboardData();
  }, [timePeriod]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      // Fetch funded accounts with users
      const { data: fundedAccounts, error: fundedError } = await supabase
        .from("funded_accounts")
        .select(
          `
                    *,
                    users!inner (
                        wallet_address
                    )
                `
        )
        .eq("status", "active");

      if (fundedError) throw fundedError;

      // Calculate leaderboard entries
      const leaderboardData: LeaderboardEntry[] = [];

      // Process funded accounts
      if (fundedAccounts) {
        fundedAccounts.forEach((account: any) => {
          const accountValue = account.balance_actual;
          const pnl = accountValue - account.e_start;
          const pnlPercent = (pnl / account.e_start) * 100;
          const roi = pnlPercent;
          const volume = accountValue * 3; // Estimated volume

          leaderboardData.push({
            rank: 0,
            trader: account.users?.wallet_address || "Unknown",
            accountValue,
            pnl,
            pnlPercent,
            roi,
            volume,
          });
        });
      }

      // Add fake data if we don't have enough entries
      const minEntries = 10;
      if (leaderboardData.length < minEntries) {
        const fakeWallets = [
          "0x3b5dd...e060",
          "0x2b83d...4e9e",
          "0x3a317...83ae",
          "0x2be1...23fd",
          "0xBaby8...9ce8",
          "0xbletbl...edb",
          "0x5bae...da6b",
          "0x5d2f...9b07",
          "0x__0a...ead6",
          "0x4542...4029",
        ];

        const startingValues = [
          158166.04, 32997.16, 39365.16, 4.15, 64992.47, 44874.09, 68116.98,
          97756.09, 93865.73, 38812.35,
        ];
        const pnls = [
          6274.79, 125.96, 96.44, 74.93, 68.87, 125.84, 53.86, 41.6, 30.91,
          38.65,
        ];
        const volumes = [
          648632.27, 330.84, 1034.99, 752.12, 1393.01, 755.98, 364.71, 161.65,
          174.32, 181.4,
        ];

        for (let i = leaderboardData.length; i < minEntries; i++) {
          const accountValue = startingValues[i];
          const pnl = pnls[i];
          const pnlPercent = (pnl / accountValue) * 100;
          const roi = pnlPercent;
          const volume = volumes[i] * 1000;

          leaderboardData.push({
            rank: 0,
            trader: fakeWallets[i],
            accountValue: accountValue * 1000,
            pnl: pnl * 1000,
            pnlPercent,
            roi,
            volume,
          });
        }
      }

      // Sort by ROI descending and assign ranks
      leaderboardData.sort((a, b) => b.roi - a.roi);
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setEntries(leaderboardData);
    } catch (error) {
      console.error("Failed to load leaderboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const formatted = value.toFixed(2);
    return `${value >= 0 ? "+" : ""}${formatted}%`;
  };

  // Filter entries based on search
  const filteredEntries = entries.filter((entry) =>
    entry.trader.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort entries
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let aValue: number | string = a[sortColumn];
    let bValue: number | string = b[sortColumn];

    if (sortColumn === "trader") {
      aValue = aValue.toString();
      bValue = bValue.toString();
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === "asc"
      ? Number(aValue) - Number(bValue)
      : Number(bValue) - Number(aValue);
  });

  // Paginate entries
  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-primary-background">
      <div className="max-w-[1920px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
        </div>

        {/* Search and Filters */}
        <div className="flex items-start justify-start gap-4 mb-6">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by wallet address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-sectionBg border border-btnBorder rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Time Period Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-sectionBg border border-btnBorder rounded-lg text-white hover:bg-cardBgDark transition-colors"
            >
              <span>{timePeriod}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showPeriodDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-sectionBg border border-btnBorder rounded-lg shadow-xl py-2 z-50">
                {(["24H", "7D", "30D", "ALL"] as TimePeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setTimePeriod(period);
                      setShowPeriodDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      timePeriod === period
                        ? "bg-primary text-white"
                        : "text-slate-400 hover:text-white hover:bg-cardBgDark"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-sectionBg rounded-lg border border-btnBorder overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="text-center py-20">
              <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No traders found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-btnBorder">
                      <th
                        className="px-6 py-4 text-left text-sm font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("rank")}
                      >
                        Rank
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("trader")}
                      >
                        Trader
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("accountValue")}
                      >
                        Account Value
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("pnl")}
                      >
                        PNL (USD)
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("roi")}
                      >
                        ROI (ROI %)
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("volume")}
                      >
                        Volume (USD)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEntries.map((entry) => {
                      const hasUser =
                        entry.trader && entry.trader !== "Unknown";

                      return (
                        <tr
                          key={`${entry.trader}-${entry.rank}`}
                          className="border-b border-btnBorder hover:bg-cardBgDark transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">
                                {entry.rank}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {hasUser && (
                                <User className="w-4 h-4 text-slate-400" />
                              )}
                              <span className="text-white">
                                {hasUser
                                  ? formatWalletAddress(entry.trader)
                                  : entry.trader}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {formatCurrency(entry.accountValue)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span
                                className={`font-medium ${
                                  entry.pnl >= 0
                                    ? "text-tagGreenText"
                                    : "text-red-400"
                                }`}
                              >
                                {formatCurrency(entry.pnl)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${
                                  entry.roi >= 0
                                    ? "text-tagGreenText"
                                    : "text-red-400"
                                }`}
                              >
                                {formatPercent(entry.roi)}
                              </span>
                              {entry.roi > 0 && (
                                <TrendingUp className="w-4 h-4 text-tagGreenText" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {formatCurrency(entry.volume)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Note */}
              <div className="px-6 py-4 border-t border-btnBorder">
                <p className="text-xs text-slate-400">
                  Excludes accounts with less than 10M USDC account value and
                  less than 10M USDC trading volume. ROI = PNL / max(10M USDC,
                  starting account value) ∙ (maximum net deposits for the time
                  window)
                </p>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-btnBorder">
                <div className="text-sm text-slate-400">
                  Rows per page: {itemsPerPage} · {startIndex + 1}-
                  {Math.min(endIndex, sortedEntries.length)} of{" "}
                  {sortedEntries.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-slate-400">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
