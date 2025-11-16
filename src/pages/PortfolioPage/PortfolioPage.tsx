/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Users,
  Filter,
  Inbox,
} from "lucide-react";
import { Button } from "../../components/ui";
import SectionWrapper from "@/components/ui/SectionWrapper";
import StatCard from "@/components/StatCard/StatCard";

// Metric Row Component
interface MetricRowProps {
  label: string;
  value: string;
  isNegative?: boolean;
}

function MetricRow({ label, value, isNegative = false }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-btnBorder last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-textBtn">{label}</span>
        <TrendingUp className="w-3 h-3 text-textBtn" />
      </div>
      <span className={`text-sm ${isNegative ? "text-red-400" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

type TabType =
  | "positions"
  | "openOrders"
  | "orderHistory"
  | "tradeHistory"
  | "fundingHistory"
  | "liquidations"
  | "publicPools"
  | "deposits"
  | "withdrawals"
  | "transfers";

const tabs: { key: TabType; label: string; count?: number }[] = [
  { key: "positions", label: "Positions" },
  { key: "openOrders", label: "Open Orders" },
  { key: "orderHistory", label: "Order History" },
  { key: "tradeHistory", label: "Trade History" },
  { key: "fundingHistory", label: "Funding History" },
  { key: "liquidations", label: "Liquidations" },
  { key: "publicPools", label: "Public Pools", count: 1 },
  { key: "deposits", label: "Deposits" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "transfers", label: "Transfers" },
];

const subTabs = [
  { key: "equity", label: "Total Equity" },
  { key: "Cumulative PnL", label: "Cumulative PnL" },
  { key: "PnL", label: "PnL" },
  { key: "Return Percentage", label: "Return Percentage" },
];

export default function PortfolioPage() {
  const [loading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("positions");
  const [activeSubTab, setActiveSubTab] = useState(subTabs[0].key);

  // Mock data - replace with real data
  const stats = {
    totalEquity: "$2,946.77",
    tradingEquity: "$1,680.70",
    availableBalance: "$602",
    publicPoolsEquity: "$1,680.70",
  };

  const metrics = [
    { label: "PnL", value: "-$2,053.22", isNegative: true },
    { label: "Volume", value: "$9,668,601.40" },
    { label: "Return Percentage", value: "-41.06%", isNegative: true },
    { label: "Average Daily PnL", value: "-$32.99", isNegative: true },
    { label: "PnL Volatility", value: "$295.24" },
    { label: "Sharpe Ratio", value: "-2.11", isNegative: true },
    { label: "Maximum Drawdown", value: "$2,940.07", isNegative: true },
  ];

  return (
    <div className="min-h-screen bg-primaryBg">
      <main className="fade-in max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-medium text-white mb-2">Portfolio</h1>
            <p className="text-textBtn text-sm">
              Track your trading performance and portfolio metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="w-40" variant="outline" size="lg">
              Invite
            </Button>
            <Button className="w-40" size="lg">
              Deposit
            </Button>
            <Button className="w-40" variant="outline" size="lg">
              Account Type
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          style={{ animationDelay: "0.1s" }}
        >
          <StatCard
            title="Total Equity"
            value={stats.totalEquity}
            icon={<DollarSign className="w-5 h-5 text-highlight" />}
            loading={loading}
            showHelp
          />
          <StatCard
            title="Trading Equity"
            value={stats.tradingEquity}
            icon={<TrendingUp className="w-5 h-5 text-highlight" />}
            loading={loading}
            showHelp
          />
          <StatCard
            title="Available Balance"
            value={stats.availableBalance}
            icon={<Wallet className="w-5 h-5 text-highlight" />}
            loading={loading}
            showHelp
          />
          <StatCard
            title="Public Pools Equity"
            value={stats.publicPoolsEquity}
            icon={<Users className="w-5 h-5 text-highlight" />}
            loading={loading}
            showHelp
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Side - Metrics */}
          <SectionWrapper className="lg:col-span-6">
            <div className="flex justify-end mb-2">
              <div className="flex items-center gap-4">
                <select className="bg-primaryBg border border-btnBorder rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-highlight">
                  <option>Total Equity</option>
                  <option>Trading Equity</option>
                  <option>Available Balance</option>
                </select>
                <select className="bg-primaryBg border border-btnBorder rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-highlight">
                  <option>All-time</option>
                  <option>1Y</option>
                  <option>6M</option>
                  <option>3M</option>
                  <option>1M</option>
                  <option>1W</option>
                </select>
              </div>
            </div>
            <div>
              {metrics.map((metric, index) => (
                <MetricRow
                  key={index}
                  label={metric.label}
                  value={metric.value}
                  isNegative={metric.isNegative}
                />
              ))}
            </div>
          </SectionWrapper>

          {/* Right Side - Chart */}
          <SectionWrapper className="lg:col-span-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6 overflow-x-auto border-b border-btnBorder">
                {subTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSubTab(tab.key)}
                    className={`whitespace-nowrap pb-2 text-sm transition-colors border-b-2 ${
                      activeSubTab === tab.key
                        ? "text-white border-highlight"
                        : "text-textBtn border-transparent hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <select className="bg-primaryBg border border-btnBorder rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-highlight">
                  <option>1M</option>
                  <option>1W</option>
                  <option>1D</option>
                </select>
              </div>
            </div>
            {/* Chart Placeholder */}
            <div className="bg-primaryBg rounded-2xl border border-btnBorder h-80 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-textBtn mx-auto mb-3" />
                <p className="text-textBtn text-sm">Chart coming soon</p>
              </div>
            </div>
          </SectionWrapper>
        </div>

        {/* Tabs Section */}
        <SectionWrapper>
          {/* Tab Headers */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-6 overflow-x-auto border-b border-btnBorder">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`whitespace-nowrap pb-2 text-sm transition-colors border-b-2 ${
                      activeTab === tab.key
                        ? "text-white border-highlight"
                        : "text-textBtn border-transparent hover:text-white"
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-2 text-xs">({tab.count})</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <select className="bg-primaryBg border border-btnBorder rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none">
                  <option>Side</option>
                </select>
                <button className="p-1.5 hover:bg-primaryBg rounded-lg transition-colors">
                  <Filter className="w-4 h-4 text-textBtn" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-12">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-6 bg-primaryBg">
                <Inbox className="w-12 h-12 text-textBtn" />
              </div>
              <p className="text-textBtn text-sm">No Open Positions</p>
            </div>
          </div>
        </SectionWrapper>
      </main>
    </div>
  );
}
