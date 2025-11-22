import { useState } from "react";
import { X, Plus, Menu } from "lucide-react";

import Chart from "../AccountTradingPage/components/Chart";
import DashboardTab from "./components/DashboardTab";
import JournalTab from "./components/JournalTab";
import SectionWrapperWithController from "@/components/ui/SectionWrapperWithController";

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

  return (
    <div className="min-h-screen fade-in">
      {/* Header Tabs */}
      <div className="border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm border-b-2 transition-colors relative flex gap-1 items-center cursor-pointer ${
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
      <div className="flex-col xl:flex-row flex mt-2 h-[calc(100vh-49px)] gap-2">
        {/* Left Panel - Main Content */}
        <div className="w-full flex-1">
          {/* Dashboard Content */}
          {activeTab === "dashboard" && <DashboardTab name={tabs[0].label} />}
          {activeTab === "journal" && <JournalTab name={tabs[1].label} />}
          {activeTab === "account" && <AccountTab />}
        </div>

        {/* Right Panel - Trading View Chart */}
        {showChartPanel && (
          <div className="w-full flex-1 flex-col flex gap-2">
            <SectionWrapperWithController
              className="h-fit"
              tabName="Trading View Chart"
            >
              <div className="w-full border-l border-slate-700/50">
                <div className="flex flex-col">
                  <Chart token="BTC" />
                </div>
              </div>
            </SectionWrapperWithController>
            <JournalTab name={tabs[1].label} />
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
