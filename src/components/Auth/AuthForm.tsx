/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Wallet, Shield, Lock, Zap } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui";
import Logo from "../Logo";

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
    <div className="min-h-screen bg-primaryBg flex items-center justify-center px-4 py-8">
      <div className="max-w-5xl w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="text-center lg:text-left space-y-6 fade-in">
            <div>
              <Logo disabled />
              <p className="text-xl text-textBtn font-medium">
                Decentralized Prop Trading Platform
              </p>
            </div>

            <div className="space-y-4 mt-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-sectionBg rounded-2xl border border-btnBorder">
                  <Shield className="w-6 h-6 text-highlight" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Secure & Transparent
                  </h3>
                  <p className="text-textBtn text-sm">
                    Trade with confidence using blockchain technology and smart
                    contracts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-sectionBg rounded-2xl border border-btnBorder">
                  <Zap className="w-6 h-6 text-highlight" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Instant Funding
                  </h3>
                  <p className="text-textBtn text-sm">
                    Pass evaluations and get funded in minutes, not days
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-sectionBg rounded-2xl border border-btnBorder">
                  <Lock className="w-6 h-6 text-highlight" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Your Assets, Your Control
                  </h3>
                  <p className="text-textBtn text-sm">
                    Non-custodial wallet integration - you always own your keys
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Card */}
          <div className="fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="bg-sectionBg rounded-2xl border border-btnBorder p-8 lg:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-highlight to-highlight/70 rounded-2xl mb-6 shadow-lg shadow-highlight/20">
                  <Wallet className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Connect Wallet
                </h2>
                <p className="text-textBtn text-sm">
                  Connect your Web3 wallet to start your trading journey
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 mb-6 fade-in">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleConnect}
                disabled={loading}
                loading={loading}
                size="lg"
                fullWidth
                leftIcon={<Wallet className="w-5 h-5" />}
              >
                {loading ? "Connecting..." : "Connect MetaMask"}
              </Button>

              <div className="mt-8 pt-6 border-t border-btnBorder">
                <p className="text-textBtn text-xs text-center mb-4">
                  Why MetaMask?
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-highlight rounded-full"></div>
                    <span className="text-textBtn">
                      Secure Web3 authentication
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-highlight rounded-full"></div>
                    <span className="text-textBtn">
                      No email or password required
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-highlight rounded-full"></div>
                    <span className="text-textBtn">
                      Full control of your assets
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-textBtn text-xs mt-6">
              By connecting, you agree to HyProp's{" "}
              <span className="text-white hover:text-highlight cursor-pointer transition-colors">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-white hover:text-highlight cursor-pointer transition-colors">
                Privacy Policy
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
