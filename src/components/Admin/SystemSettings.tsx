import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function SystemSettings() {
  const [marginWatchdog, setMarginWatchdog] = useState('5000');
  const [equitySnapshot, setEquitySnapshot] = useState('1000');
  const [equityVerifier, setEquityVerifier] = useState('3000');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from('config')
      .select('*')
      .in('key', ['margin_watchdog_interval_ms', 'equity_snapshot_interval_ms', 'equity_verifier_interval_ms']);

    if (data) {
      data.forEach((item) => {
        const value = (item.value as any).interval;
        if (item.key === 'margin_watchdog_interval_ms') setMarginWatchdog(value);
        if (item.key === 'equity_snapshot_interval_ms') setEquitySnapshot(value);
        if (item.key === 'equity_verifier_interval_ms') setEquityVerifier(value);
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      await Promise.all([
        supabase.from('config').upsert({
          key: 'margin_watchdog_interval_ms',
          value: { interval: parseInt(marginWatchdog) },
        }),
        supabase.from('config').upsert({
          key: 'equity_snapshot_interval_ms',
          value: { interval: parseInt(equitySnapshot) },
        }),
        supabase.from('config').upsert({
          key: 'equity_verifier_interval_ms',
          value: { interval: parseInt(equityVerifier) },
        }),
      ]);

      setMessage('Settings saved successfully');
    } catch (error) {
      setMessage('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">System Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Margin Watchdog Interval (ms)
          </label>
          <input
            type="number"
            value={marginWatchdog}
            onChange={(e) => setMarginWatchdog(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-slate-400">
            How often to check margin requirements
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Equity Snapshot Interval (ms)
          </label>
          <input
            type="number"
            value={equitySnapshot}
            onChange={(e) => setEquitySnapshot(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-slate-400">
            How often to snapshot equity for monitoring
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Equity Verifier Interval (ms)
          </label>
          <input
            type="number"
            value={equityVerifier}
            onChange={(e) => setEquityVerifier(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-slate-400">
            How often to verify equity from authoritative source
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('success')
              ? 'bg-green-500/10 border border-green-500 text-green-400'
              : 'bg-red-500/10 border border-red-500 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>{loading ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
}
