import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { HyperliquidTrading } from '../../lib/hyperliquidTrading';

interface OrderFormProps {
  accountId: string;
  walletAddress: string;
  currentPrice: number;
  privateKey: string | null;
  builderCode: string | null;
  onOrderPlaced: () => void;
}

export function OrderForm({ accountId, walletAddress, currentPrice, privateKey, builderCode, onOrderPlaced }: OrderFormProps) {
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [size, setSize] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvingFee, setApprovingFee] = useState(false);
  const [feeApproved, setFeeApproved] = useState(false);

  const handleApproveBuilderFee = async () => {
    if (!privateKey) {
      setError('No Hyperliquid API key configured for this account');
      return;
    }

    setApprovingFee(true);
    setError(null);

    try {
      const trading = new HyperliquidTrading(accountId, walletAddress);
      await trading.approveBuilderFee();
      setFeeApproved(true);
      setError(null);
      alert('Builder fee approved successfully! You can now place orders.');
    } catch (error: any) {
      console.error('Approve builder fee failed:', error);
      setError(error.message || 'Failed to approve builder fee');
    } finally {
      setApprovingFee(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!privateKey) {
      setError('No Hyperliquid API key configured for this account');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const trading = new HyperliquidTrading(accountId, walletAddress);

      const isBuy = side === 'long';
      const sizeNum = parseFloat(size);
      const priceNum = orderType === 'limit' ? parseFloat(limitPrice || currentPrice.toString()) : currentPrice;

      console.log('=== ORDER FORM SUBMISSION ===');
      console.log('Side:', side, '-> isBuy:', isBuy);
      console.log('Size input:', size, '-> sizeNum:', sizeNum);
      console.log('Order type:', orderType);
      console.log('Current price:', currentPrice);
      console.log('Limit price input:', limitPrice);
      console.log('Price to send:', orderType === 'limit' ? priceNum : null);

      const result = await trading.placeOrder(
        'BTC',
        isBuy,
        sizeNum,
        orderType === 'limit' ? priceNum : null,
        orderType,
        false
      );

      console.log('Order result:', result);

      if (result.status === 'ok') {
        onOrderPlaced();
        setSize('');
        setLimitPrice('');
      } else {
        setError(result.response || 'Order failed');
      }
    } catch (error: any) {
      console.error('Order failed:', error);
      setError(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const estimatedValue = parseFloat(size || '0') * currentPrice;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Place Order</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex bg-slate-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setSide('long')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
              side === 'long'
                ? 'bg-green-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Long</span>
          </button>
          <button
            type="button"
            onClick={() => setSide('short')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
              side === 'short'
                ? 'bg-red-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Short</span>
          </button>
        </div>

        <div className="flex bg-slate-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setOrderType('market')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              orderType === 'market'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Market
          </button>
          <button
            type="button"
            onClick={() => setOrderType('limit')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              orderType === 'limit'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Limit
          </button>
        </div>

        {orderType === 'limit' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Limit Price
            </label>
            <input
              type="number"
              step="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={currentPrice.toFixed(2)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Size (BTC)
          </label>
          <input
            type="number"
            step="0.001"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.000"
            required
          />
        </div>

        {size && (
          <div className="bg-slate-700 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Value</span>
              <span className="text-white font-semibold">
                ${estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Entry Price</span>
              <span className="text-white font-semibold">
                ${orderType === 'market' ? currentPrice.toFixed(2) : (limitPrice || currentPrice.toFixed(2))}
              </span>
            </div>
          </div>
        )}

        {error && error.toLowerCase().includes('builder fee') && (
          <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3 space-y-2">
            <p className="text-yellow-400 text-sm">
              {error}
            </p>
            <button
              type="button"
              onClick={handleApproveBuilderFee}
              disabled={approvingFee}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {approvingFee ? 'Approving...' : 'Approve Builder Fee'}
            </button>
          </div>
        )}

        {error && !error.toLowerCase().includes('builder fee') && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {feeApproved && (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-3 text-green-400 text-sm">
            Builder fee approved! You can now place orders.
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !size}
          className={`w-full py-3 font-semibold rounded-lg transition-colors ${
            side === 'long'
              ? 'bg-green-600 hover:bg-green-700 disabled:bg-slate-600'
              : 'bg-red-600 hover:bg-red-700 disabled:bg-slate-600'
          } text-white disabled:cursor-not-allowed`}
        >
          {loading ? 'Placing Order...' : `${side === 'long' ? 'Buy' : 'Sell'} ${orderType === 'market' ? 'Market' : 'Limit'}`}
        </button>
      </form>
    </div>
  );
}
