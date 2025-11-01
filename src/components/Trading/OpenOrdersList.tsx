import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { getOpenOrders } from '../../lib/hyperliquidTrading';
import { HyperliquidTrading } from '../../lib/hyperliquidTrading';

interface OpenOrdersListProps {
  accountId: string;
  walletAddress: string;
  address: string;
  privateKey: string | null;
  builderCode: string | null;
  onOrderCancelled: () => void;
}

export function OpenOrdersList({ accountId, walletAddress, address, privateKey, builderCode, onOrderCancelled }: OpenOrdersListProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getOpenOrders(address);
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [address]);

  const handleCancelOrder = async (coin: string, oid: number) => {
    if (!privateKey) return;

    setCancelling(oid);
    try {
      const trading = new HyperliquidTrading(accountId, walletAddress);
      await trading.cancelOrder(coin, oid);
      onOrderCancelled();
      loadOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setCancelling(null);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No open orders
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Open Orders</h3>
        <button
          onClick={loadOrders}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {orders.map((order) => (
        <div
          key={order.oid}
          className="bg-slate-700 rounded-lg p-4 border border-slate-600"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-semibold">{order.coin}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    order.side === 'B' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {order.side === 'B' ? 'Buy' : 'Sell'}
                </span>
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {order.orderType === 'Limit' ? 'Limit' : 'Market'} Order
              </div>
            </div>
            <button
              onClick={() => handleCancelOrder(order.coin, order.oid)}
              disabled={cancelling === order.oid}
              className="p-1 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-slate-400">Size</div>
              <div className="text-white font-medium">{order.sz}</div>
            </div>
            <div>
              <div className="text-slate-400">Price</div>
              <div className="text-white font-medium">${parseFloat(order.limitPx).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
