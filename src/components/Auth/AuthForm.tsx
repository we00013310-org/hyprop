/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Wallet } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function AuthForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { connectWallet } = useAuth();

  const handleConnect = async () => {
    setError("");
    setLoading(true);

    try {
      await connectWallet();
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">HyProp</h1>
          <p className="text-slate-400">Decentralized Prop Trading Platform</p>
        </div>

        <div className="bg-slate-800 rounded-xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Connect Wallet
            </h2>
            <p className="text-slate-400">
              Connect your Web3 wallet to get started
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center justify-center space-x-2"
          >
            <Wallet className="w-5 h-5" />
            <span>{loading ? "Connecting..." : "Connect MetaMask"}</span>
          </button>

          <div className="mt-6 space-y-2 text-sm text-slate-400">
            <p className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              <span>Secure Web3 authentication</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              <span>No email or password required</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              <span>Full control of your assets</span>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm">
          By connecting, you agree to HyProp's Terms of Service and Privacy
          Policy
        </p>
      </div>
    </div>
  );
}
