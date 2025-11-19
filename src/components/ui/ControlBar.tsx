import { Copy, GripVertical, Menu, RefreshCw, X } from "lucide-react";
import { useState } from "react";

const timeRanges = ["Today", "Last Week", "Last Month", "All History"];

const ControlBar = ({ tabName }: { tabName: string }) => {
  const [timeRange, setTimeRange] = useState("Today");
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);

  return (
    <div className="flex justify-between items-center gap-2 text-xs">
      <div className="flex items-center gap-2">
        <div className="text-white pl-4 pr-1 flex gap-1 items-center">
          <GripVertical className="w-4 h-4 text-slate-400" />
          {tabName}
        </div>
        {/* Time Range */}
        <div className="relative  border-l border-slate-700/50">
          <button
            onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
            className="px-3 py-1 flex items-center gap-2 hover:opacity-60 transition-all cursor-pointer"
          >
            <span className="text-textBtn">Time Range:</span>
            <span className="text-highlight">{timeRange}</span>
          </button>
          {showTimeRangeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-dropdownBg border border-slate-700 rounded-lg shadow-xl z-10">
              <div className="p-1">
                {timeRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setShowTimeRangeDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-slate-700/50 ${
                      timeRange === range ? "text-highlight" : "text-textBtn"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Asset Type */}
        <div className="relative">
          <button
            onClick={() => setShowAssetDropdown(!showAssetDropdown)}
            className="px-3 py-1 flex items-center gap-2 hover:opacity-60 transition-all cursor-pointer"
          >
            <span className="text-textBtn">Asset Type:</span>
            <span className="text-highlight">All</span>
          </button>
          {showAssetDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-dropdownBg border border-slate-700 rounded-lg shadow-xl z-10">
              <div className="p-1">
                <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-700/50 text-teal-500">
                  All
                </button>
                <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-700/50 text-slate-300">
                  BTCUSD
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Refresh Metrics */}
        <button className="text-highlight flex gap-1 cursor-pointer hover:opacity-60 items-center transition-all ml-4">
          <RefreshCw className="w-3 h-3" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      <div className="flex items-center gap-1 mr-4 text-textBtn">
        <Copy className="w-3 h-3 cursor-pointer hover:opacity-60 transition-all" />
        <Menu className="w-3 h-3 cursor-pointer hover:opacity-60 transition-all" />
        <X className="w-3 h-3 cursor-pointer hover:opacity-60 transition-all" />
      </div>
    </div>
  );
};

export default ControlBar;
