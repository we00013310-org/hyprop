import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getUserFills } from '../../lib/hyperliquidTrading';

interface TradeHistoryListProps {
  address: string;
}

export function TradeHistoryList({ address }: TradeHistoryListProps) {
  const [fills, setFills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFills = async () => {
    setLoading(true);
    try {
      const data = await getUserFills(address);
      setFills(data.slice(0, 50));
    } catch (error) {
      console.error('Failed to load fills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFills();
    const interval = setInterval(loadFills, 10000);
    return () => clearInterval(interval);
  }, [address]);

  if (loading && fills.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (fills.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No trade history
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Trade History</h3>
        <button
          onClick={loadFills}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {fills.map((fill, index) => (
          <div
            key={`${fill.oid}-${fill.time}-${index}`}
            className="bg-slate-700 rounded-lg p-3 border border-slate-600"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-white font-semibold">{fill.coin}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    fill.side === 'B' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {fill.side === 'B' ? 'Buy' : 'Sell'}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {new Date(fill.time).toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-slate-400">Size</div>
                <div className="text-white font-medium">{fill.sz}</div>
              </div>
              <div>
                <div className="text-slate-400">Price</div>
                <div className="text-white font-medium">${parseFloat(fill.px).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-slate-400">Fee</div>
                <div className="text-white font-medium">${parseFloat(fill.fee || 0).toFixed(4)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
