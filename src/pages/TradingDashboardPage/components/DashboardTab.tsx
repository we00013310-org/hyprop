import SectionWrapperWithController from "@/components/ui/SectionWrapperWithController";
import MetricCard from "./MetricCard";

const DashboardTab = ({ name }: { name: string }) => {
  return (
    <SectionWrapperWithController tabName={name}>
      <div>
        {/* Top Row - Main Metrics */}
        <div className="grid grid-cols-2 gap-1 mb-1">
          <MetricCard title="Total Net PU" value="$0" />
          <MetricCard title="Avg Daily Net P&L" value="$0" />
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-4 gap-1 mb-1">
          <MetricCard title="Risk/Reward Ratio" value="1:1.0" />
          <MetricCard title="% Return" value="0%" />
          <MetricCard title="Avg Winning Trade Holding Time" value="0 Hrs" />
          <MetricCard title="Avg Losing Trade Holding Time" value="0 Hrs" />
        </div>

        {/* Third Row */}
        <div className="grid grid-cols-4 gap-1 mb-1">
          <MetricCard title="Win Rate" value="0%" />
          <MetricCard title="% Return" value="0%" />
          <div className="bg-[#0F1A1E66] rounded-lg p-4 flex flex-col justify-center items-center gap-1">
            <div className="text-xs text-textBtn mb-2">Max Drawdown</div>
            <div className="flex w-full items-center gap-2">
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="text-4xl font-semibold text-white">0%</div>
                <div className="text-[0.5rem] text-textBtn">For the Period</div>
              </div>
              <div className="w-px h-12 bg-slate-700" />
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="text-4xl font-semibold text-white">0%</div>
                <div className="text-[0.5rem] text-textBtn">Total History</div>
              </div>
            </div>
            <div className="mt-3 h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div className="h-full bg-highlight w-0" />
            </div>
          </div>
          <MetricCard title="Avg Losing Trade Holding Time" value="0 Hrs" />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-1">
          <div className="bg-[#0F1A1E66] rounded-lg p-4 flex flex-col justify-center gap-1 items-center h-50">
            <div className="text-xs text-textBtn">Instruments Traded</div>
            <div className="text-[0.5rem] text-textBtn">
              Positive and Negative Product P&L
            </div>
            <div className="text-4xl font-bold text-white">1</div>
            <div className="text-sm text-textBtn">BTCUSD</div>
          </div>
          <div className="bg-[#0F1A1E66] rounded-lg p-4 flex flex-col justify-center items-center gap-1 h-50">
            <div className="text-xs text-textBtn">Per Day Traded Net P&L</div>
            <div className="text-4xl font-bold text-white">1</div>
            <div className="text-sm text-textBtn">BTCUSD</div>
          </div>
        </div>
      </div>
    </SectionWrapperWithController>
  );
};

export default DashboardTab;
