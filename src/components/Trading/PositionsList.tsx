import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Position = Database['public']['Tables']['positions']['Row'];

interface PositionsListProps {
  accountId: string;
}

export function PositionsList({ accountId }: PositionsListProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPositions();
  }, [accountId]);

  const loadPositions = async () => {
    const { data } = await supabase
      .from('positions')
      .select('*')
      .eq('account_id', accountId);

    if (data) {
      setPositions(data);
    }
    setLoading(false);
  };

  const handleClosePosition = async (positionId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    loadPositions();
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Positions</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Positions</h3>

      {positions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No open positions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((position) => (
            <div
              key={position.id}
              className="bg-slate-700 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-white font-semibold">{position.symbol}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    position.side === 'long'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {position.side.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Size: </span>
                    <span className="text-white">{position.size} BTC</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Entry: </span>
                    <span className="text-white">${position.avg_entry.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">uPnL: </span>
                    <span className={position.upnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {position.upnl >= 0 ? '+' : ''}${position.upnl.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">rPnL: </span>
                    <span className={position.rpnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {position.rpnl >= 0 ? '+' : ''}${position.rpnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleClosePosition(position.id)}
                className="ml-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                title="Close Position"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
