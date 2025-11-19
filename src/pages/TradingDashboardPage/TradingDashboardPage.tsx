import { useState } from "react";
import { X, Plus, Settings, Menu } from "lucide-react";

import Chart from "../AccountTradingPage/components/Chart";
import DashboardTab from "./components/DashboardTab";

const tabs = [
  { id: "dashboard" as const, label: "Trading Dashboard" },
  { id: "journal" as const, label: "Trading Journal" },
  { id: "account" as const, label: "My Trading Account" },
];

const TradingDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "journal" | "account"
  >("dashboard");
  const [showChartPanel, setShowChartPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header Tabs */}
      <div className="border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm border-b-2 transition-colors relative flex gap-1 items-center ${
                  activeTab === tab.id
                    ? "border-highlight text-highlight"
                    : "border-transparent text-textBtn hover:opacity-60"
                }`}
              >
                <Menu className="w-4 h-4" />
                {tab.label}
                {tab.id === activeTab && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab("dashboard");
                    }}
                    className="p-0 flex justify-center items-center hover:text-slate-300"
                  >
                    <X className="w-4 h-4 " />
                  </button>
                )}
              </button>
            ))}
            <button className="px-4 py-3 text-slate-400 hover:text-slate-200">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex mt-2 h-[calc(100vh-49px)]">
        {/* Left Panel - Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Dashboard Content */}
          {activeTab === "dashboard" && <DashboardTab name={tabs[0].label} />}
          {activeTab === "journal" && <JournalTab />}
          {activeTab === "account" && <AccountTab />}
        </div>

        {/* Right Panel - Trading View Chart */}
        {showChartPanel && (
          <div className="w-[600px] border-l border-slate-700/50 bg-slate-900">
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-200">
                  Trading View Chart
                </h3>
                <button
                  onClick={() => setShowChartPanel(false)}
                  className="p-1 hover:bg-slate-800 rounded"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="flex-1">
                <Chart token="BTC" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Toggle Button (bottom right when chart is hidden) */}
      {!showChartPanel && (
        <button
          onClick={() => setShowChartPanel(true)}
          className="fixed bottom-6 right-6 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow-lg transition-colors flex items-center gap-2"
        >
          <span>Show Chart</span>
        </button>
      )}
    </div>
  );
};

// Journal Tab Component
const JournalTab = () => {
  // Mock data for journal entries
  const entries = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    symbol: "BTCUSD",
    datetime: "13/11/25 12:42",
    orderId: "340015865",
    size: i % 2 === 0 ? "Buy" : "Sell",
    effect: i === 0 ? "Opening" : "Closing",
    volume: "0.001",
    price: "101,947.7",
    pnl: i % 3 === 0 ? "-" : "0.04",
    ccv: i % 3 === 0 ? "-" : "554",
    tags: [
      i % 2 === 0 ? "News" : i % 3 === 0 ? "Mistake" : "Strategy",
      i % 2 === 0 && "Impulse",
    ].filter(Boolean),
  }));

  return (
    <div className="p-4">
      {/* Filter Tags */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-slate-400">Tag</span>
        <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30">
          News
        </button>
        <button className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs border border-purple-500/30">
          Impulse
        </button>
        <button className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-xs border border-teal-500/30">
          Strategy
        </button>
        <button className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs border border-orange-500/30">
          Market Event
        </button>
        <button className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs border border-red-500/30">
          Error
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                Symbol
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                Date and Time
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                Order ID
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                Size
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                Position Effect
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                Trade Volume
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                Trade Price
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                P&L P/PS
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                P&L CCV
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                Tags
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-700/30">
                <td className="px-4 py-3 text-sm text-slate-200">
                  {entry.symbol}
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {entry.datetime}
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {entry.orderId}
                </td>
                <td
                  className={`px-4 py-3 text-sm font-medium ${
                    entry.size === "Buy" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {entry.size}
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {entry.effect}
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {entry.volume}
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {entry.price}
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {entry.pnl}
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {entry.ccv}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          tag === "News"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : tag === "Impulse"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : tag === "Strategy"
                            ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                            : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-400"></td>
              </tr>
            ))}
            <tr className="bg-slate-800/50">
              <td className="px-4 py-3 text-sm font-medium text-slate-200">
                Total Portfolio
              </td>
              <td colSpan={6}></td>
              <td className="px-4 py-3 text-sm text-slate-300">0.04</td>
              <td className="px-4 py-3 text-sm text-slate-300">554</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Account Tab Component
const AccountTab = () => {
  return (
    <div className="p-6">
      <div className="text-center py-12 text-slate-400">
        <p>My Trading Account details coming soon</p>
      </div>
    </div>
  );
};

export default TradingDashboardPage;
