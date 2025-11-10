import { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { getRealBTCPriceWithFallback } from '../../lib/priceOracle';

interface DemoSettingsProps {
  onBack: () => void;
}

export function DemoSettings({ onBack }: DemoSettingsProps) {
  const [priceOffset, setPriceOffset] = useState<string>('');
  const [currentOffset, setCurrentOffset] = useState<number>(0);
  const [realPrice, setRealPrice] = useState<number | null>(null);
  const [adjustedPrice, setAdjustedPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load current offset from localStorage
    const offset = localStorage.getItem('demo_btc_price_offset');
    if (offset) {
      const parsed = parseFloat(offset);
      if (!isNaN(parsed)) {
        setCurrentOffset(parsed);
        setPriceOffset(offset);
      }
    }

    // Fetch current price
    fetchPrice();
  }, []);

  const fetchPrice = async () => {
    setLoading(true);
    try {
      const data = await getRealBTCPriceWithFallback();
      setAdjustedPrice(data.price);

      // Calculate real price (remove current offset)
      const offset = parseFloat(localStorage.getItem('demo_btc_price_offset') || '0');
      setRealPrice(data.price - offset);
    } catch (error) {
      console.error('Failed to fetch price:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyOffset = () => {
    const offset = parseFloat(priceOffset);
    if (isNaN(offset)) {
      alert('Please enter a valid number');
      return;
    }

    localStorage.setItem('demo_btc_price_offset', offset.toString());
    setCurrentOffset(offset);
    fetchPrice();
    alert(`Price offset set to ${offset >= 0 ? '+' : ''}${offset}`);
  };

  const handleClearOffset = () => {
    localStorage.removeItem('demo_btc_price_offset');
    setCurrentOffset(0);
    setPriceOffset('');
    fetchPrice();
    alert('Price offset cleared');
  };

  const previewPrice = realPrice && priceOffset ? realPrice + parseFloat(priceOffset || '0') : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Demo Settings</h1>
            <p className="text-slate-400 mt-1">Testing tools for price simulation</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-yellow-500">Demo Mode Only</h3>
            <p className="text-sm text-slate-300 mt-1">
              This page is for testing purposes only. The price offset will affect all BTC prices displayed
              in the application and PnL calculations for simulated positions.
            </p>
          </div>
        </div>

        {/* Current Price Info */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current BTC Price</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Real Price</div>
              <div className="text-2xl font-bold">
                {loading ? (
                  <span className="text-slate-500">Loading...</span>
                ) : realPrice ? (
                  `$${realPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                  <span className="text-slate-500">--</span>
                )}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Adjusted Price (with offset)</div>
              <div className="text-2xl font-bold">
                {loading ? (
                  <span className="text-slate-500">Loading...</span>
                ) : adjustedPrice ? (
                  <>
                    <span className={currentOffset !== 0 ? 'text-blue-400' : ''}>
                      ${adjustedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {currentOffset !== 0 && (
                      <span className="text-sm text-blue-400 ml-2">
                        ({currentOffset > 0 ? '+' : ''}{currentOffset})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-500">--</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={fetchPrice}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Price'}
          </button>
        </div>

        {/* Price Offset Control */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Price Offset Control</h2>
          <p className="text-slate-400 text-sm mb-4">
            Enter a number to adjust the BTC price. Positive values increase the price, negative values decrease it.
            For example, entering -5000 will reduce the BTC price by $5,000.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Price Offset (USD)
              </label>
              <input
                type="number"
                value={priceOffset}
                onChange={(e) => setPriceOffset(e.target.value)}
                placeholder="e.g., -5000"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {priceOffset && !isNaN(parseFloat(priceOffset)) && previewPrice && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Preview Price</div>
                <div className="text-xl font-bold text-blue-400">
                  ${previewPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm ml-2">
                    ({parseFloat(priceOffset) > 0 ? '+' : ''}{parseFloat(priceOffset)})
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleApplyOffset}
                disabled={!priceOffset || isNaN(parseFloat(priceOffset))}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Apply Offset
              </button>
              <button
                onClick={handleClearOffset}
                disabled={currentOffset === 0}
                className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:text-slate-500 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Clear Offset
              </button>
            </div>

            {currentOffset !== 0 && (
              <div className="text-center text-sm text-blue-400">
                Current offset: {currentOffset > 0 ? '+' : ''}{currentOffset} USD
              </div>
            )}
          </div>
        </div>

        {/* Examples */}
        <div className="mt-6 bg-slate-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Examples</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• Enter <code className="bg-slate-700 px-2 py-1 rounded">-5000</code> to decrease BTC price by $5,000</li>
            <li>• Enter <code className="bg-slate-700 px-2 py-1 rounded">10000</code> to increase BTC price by $10,000</li>
            <li>• Enter <code className="bg-slate-700 px-2 py-1 rounded">0</code> or clear to use real price</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
