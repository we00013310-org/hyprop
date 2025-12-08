import SectionWrapperWithController from "@/components/ui/SectionWrapperWithController";

interface JournalTabProps {
  name: string;
}

const JournalTab = ({ name }: JournalTabProps) => {
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
    <SectionWrapperWithController showTags tabName={name}>
      <div className="fade-in">
        {/* Table */}
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-2 py-2 text-xs font-medium text-slate-400">
                  Symbol
                </th>
                <th className="text-left px-2 py-2 text-xs font-medium text-slate-400">
                  Date and Time
                </th>
                <th className="text-left px-2 py-2 text-xs font-medium text-slate-400">
                  Order ID
                </th>
                <th className="text-left px-2 py-2 text-xs font-medium text-slate-400">
                  Size
                </th>
                <th className="text-left px-2 py-2 text-xs font-medium text-slate-400">
                  Position Effect
                </th>
                <th className="text-left px-2 py-2 text-xs font-medium text-slate-400">
                  Trade Volume
                </th>
                <th className="text-left px-2 py-2 text-xs font-medium text-slate-400">
                  Trade Price
                </th>
                <th className="text-left px-2 py-2 text-xs font-medium text-slate-400">
                  P&L P/PS
                </th>
                <th className="text-left px-2 py-2 text-xs font-medium text-slate-400">
                  P&L CCV
                </th>
                <th className="text-left px-2 py-2 text-xs font-medium text-slate-400">
                  Tags
                </th>
                <th className="text-left px-2 py-2 text-xs font-medium text-slate-400">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-700/30">
                  <td className="px-2 py-2 text-xs text-slate-200">
                    {entry.symbol}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-300">
                    {entry.datetime}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-300">
                    {entry.orderId}
                  </td>
                  <td
                    className={`px-2 py-2 text-xs font-medium ${
                      entry.size === "Buy" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {entry.size}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-300">
                    {entry.effect}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-300">
                    {entry.volume}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-300">
                    {entry.price}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-300">
                    {entry.pnl}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-300">
                    {entry.ccv}
                  </td>
                  <td className="px-2 py-2">
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
                  <td className="px-2 py-2 text-xs text-slate-400"></td>
                </tr>
              ))}
              <tr className="bg-black/20">
                <td className="px-2 py-2 text-xs font-medium text-slate-200">
                  Total Portfolio
                </td>
                <td colSpan={6}></td>
                <td className="px-2 py-2 text-xs text-slate-300">0.04</td>
                <td className="px-2 py-2 text-xs text-slate-300">554</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionWrapperWithController>
  );
};

export default JournalTab;
