import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { getUserPositions } from '../../lib/hyperliquidTrading';

interface PositionsListProps {
  address: string;
}

export function PositionsList({ address }: PositionsListProps) {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPositions = async () => {
    setLoading(true);
    try {
      const data = await getUserPositions(address);
      const openPositions = data.filter((pos: any) => parseFloat(pos.position.szi) !== 0);
      setPositions(openPositions);
    } catch (error) {
      console.error('Failed to load positions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPositions();
    const interval = setInterval(loadPositions, 5000);
    return () => clearInterval(interval);
  }, [address]);

  if (loading && positions.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No open positions
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={loadPositions}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {positions.map((pos, index) => {
        const size = parseFloat(pos.position.szi);
        const entryPx = parseFloat(pos.position.entryPx || 0);
        const unrealizedPnl = parseFloat(pos.position.unrealizedPnl || 0);
        const isLong = size > 0;

        return (
          <div
            key={`${pos.position.coin}-${index}`}
            className="bg-slate-700 rounded-lg p-4 border border-slate-600"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-white font-semibold">{pos.position.coin}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    isLong ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {isLong ? 'Long' : 'Short'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-400">Size</div>
                <div className="text-white font-medium">{Math.abs(size).toFixed(4)}</div>
              </div>
              <div>
                <div className="text-slate-400">Entry Price</div>
                <div className="text-white font-medium">${entryPx.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-slate-400">Unrealized PnL</div>
                <div className={`font-medium ${unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Margin Used</div>
                <div className="text-white font-medium">${parseFloat(pos.position.marginUsed || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
