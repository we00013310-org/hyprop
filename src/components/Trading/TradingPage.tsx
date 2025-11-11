/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Wallet,
  AlertTriangle,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useHyperliquidPrice } from "../../hooks/useHyperliquidPrice";
import { useAuth } from "../../contexts/AuthContext";
import { OrderForm } from "./OrderForm";
import { PositionsList } from "./PositionsList";
// import { OpenOrdersList } from "./OpenOrdersList";
// import { TradeHistoryList } from "./TradeHistoryList";
import { TradingViewChart } from "./TradingViewChart";
import {
  // getOpenOrders,
  getUserPositions,
  HyperliquidTrading,
} from "../../lib/hyperliquidTrading";
import type { Database } from "../../lib/database.types";
import { useParams, useLocation } from "wouter";

type TestAccount = Database["public"]["Tables"]["test_accounts"]["Row"];
type Checkpoint =
  Database["public"]["Tables"]["test_account_checkpoints"]["Row"];

const TradingPage = () => {
  const { accountId } = useParams();
  const [, setLocation] = useLocation();

  const { walletAddress } = useAuth();
  const [account, setAccount] = useState<TestAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "positions" | "orders" | "history"
  >("positions");
  const [positionsCount, setPositionsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const {
    price: currentPrice,
    priceChange,
    isConnected,
  } = useHyperliquidPrice("BTC");
  const [key, setKey] = useState(Date.now()); // use this to revalidate Positions List

  useEffect(() => {
    loadAccount();
    loadCheckpoints();
  }, [accountId]);

  useEffect(() => {
    if (accountId && walletAddress) {
      loadCounts();
      const interval = setInterval(loadCounts, 5000);
      return () => clearInterval(interval);
    }
  }, [accountId, walletAddress]);

  const loadCheckpoints = async () => {
    if (!accountId) return;

    const { data } = await supabase
      .from("test_account_checkpoints")
      .select("*")
      .eq("test_account_id", accountId)
      .order("checkpoint_number", { ascending: true });

    if (data) {
      setCheckpoints(data);
    }
  };

  // Update countdown every second
  useEffect(() => {
    if (!account || account.status !== "active") return;

    const updateCountdown = () => {
      const checkpointIntervalHours = account.checkpoint_interval_hours || 24;
      const currentCheckpoint = account.current_checkpoint || 1;

      const createdAt = new Date(account.created_at);
      console.log("createdAt", createdAt);
      const now = new Date();
      const timeElapsed = now.getTime() - createdAt.getTime();

      const nextCheckpointMs =
        currentCheckpoint * checkpointIntervalHours * 60 * 60 * 1000;
      const remainingMs = Math.max(0, nextCheckpointMs - timeElapsed);

      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor(
        (remainingMs % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [account]);

  // PHASE 1: Check test status periodically
  useEffect(() => {
    console.log("accountId", accountId, walletAddress);
    if (!accountId || !walletAddress) return;

    const checkTestStatus = async () => {
      try {
        const trading = new HyperliquidTrading(accountId, walletAddress);
        const result = await trading.checkTestStatus();
        console.log("result", result);

        if (result?.shouldPass || result?.status === "failed") {
          // Reload account to get updated status
          loadAccount();
          loadCheckpoints();
        }
      } catch (error) {
        console.error("Failed to check test status:", error);
      }
    };

    checkTestStatus();
    const interval = setInterval(checkTestStatus, 15000);
    return () => clearInterval(interval);
  }, [accountId, walletAddress]);

  const loadCounts = async () => {
    if (!accountId || !walletAddress) return;

    try {
      // PHASE 1: For test accounts, use database positions
      const positionsData = await getUserPositions(
        "",
        accountId,
        walletAddress
      );
      const openPositions = positionsData.filter((pos: any) => {
        const size = parseFloat(pos.position?.szi || "0");
        return size !== 0;
      });
      setPositionsCount(openPositions.length);
      setOrdersCount(0); // Orders not supported in Phase 1
    } catch (error) {
      console.error("Failed to load counts:", error);
    }
  };

  const loadAccount = async () => {
    const { data } = await supabase
      .from("test_accounts")
      .select("*")
      .eq("id", accountId as string)
      .single();

    if (data) {
      setAccount(data);
    }
    setLoading(false);
  };

  const isAccountActive = account?.status === "active";

  const reloadData = () => {
    loadAccount();
  };

  if (loading || !account) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                {isConnected ? (
                  <Wifi className="w-5 h-5 text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
                <div className="text-center">
                  <div className="text-sm text-slate-400">
                    BTC-PERP (Hyperliquid Testnet)
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-white">
                      $
                      {currentPrice > 0
                        ? currentPrice.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "---"}
                    </span>
                    {priceChange !== 0 && (
                      <span
                        className={`text-sm flex items-center ${
                          priceChange >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {priceChange >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {Math.abs(priceChange).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trading Account Info - Consolidated */}
        <div
          className={`mb-6 bg-slate-800 border rounded-xl p-6 ${
            isAccountActive ? "border-slate-700" : "border-slate-600 opacity-75"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Wallet
                className={`w-6 h-6 ${
                  isAccountActive ? "text-blue-500" : "text-slate-500"
                }`}
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h3
                    className={`text-lg font-semibold ${
                      isAccountActive ? "text-white" : "text-slate-400"
                    }`}
                  >
                    Test Trading Account
                  </h3>
                  {!isAccountActive && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        account.status === "passed"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {account.status === "passed" ? "READ ONLY" : "DISABLED"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400">
                  {account.account_mode.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Virtual Balance</div>
              <div
                className={`text-2xl font-bold ${
                  isAccountActive ? "text-white" : "text-slate-500"
                }`}
              >
                $
                {account.virtual_balance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          {!isAccountActive && (
            <div
              className={`mb-6 p-3 rounded-lg border ${
                account.status === "passed"
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  account.status === "passed"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {account.status === "passed"
                  ? "✓ Test completed successfully! This account is read-only. You can view positions and history but cannot place new orders."
                  : "✗ Trading is disabled for this account. You can view positions and history but cannot place new orders."}
              </p>
            </div>
          )}

          {/* Checkpoint Evaluation Progress */}
          {isAccountActive &&
            (() => {
              const numCheckpoints = account.num_checkpoints || 3;
              const profitTargetPercent =
                account.checkpoint_profit_target_percent || 8.0;
              const currentCheckpoint = account.current_checkpoint || 1;

              // Calculate required balance for current checkpoint
              let nextRequiredBalance = 0;
              if (currentCheckpoint === 1) {
                nextRequiredBalance =
                  account.account_size * (1 + profitTargetPercent / 100);
              } else {
                const previousCheckpoint = checkpoints.find(
                  (cp) => cp.checkpoint_number === currentCheckpoint - 1
                );
                const previousBalance = previousCheckpoint
                  ? Number(previousCheckpoint.checkpoint_balance)
                  : account.account_size;
                nextRequiredBalance =
                  previousBalance * (1 + profitTargetPercent / 100);
              }

              const meetsCurrentRequirement =
                account.virtual_balance >= nextRequiredBalance;

              return (
                <div className="mb-6 bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <span className="text-sm font-medium text-slate-200">
                        Evaluation Progress: Checkpoint {currentCheckpoint} of{" "}
                        {numCheckpoints}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-mono font-semibold text-blue-400">
                        {String(countdown.hours).padStart(2, "0")}:
                        {String(countdown.minutes).padStart(2, "0")}:
                        {String(countdown.seconds).padStart(2, "0")}
                      </span>
                      <span className="text-xs text-slate-400">remaining</span>
                    </div>
                  </div>

                  {/* Checkpoint Status */}
                  <div className="flex items-center space-x-2 mb-4">
                    {Array.from({ length: numCheckpoints }, (_, i) => {
                      const checkpointNum = i + 1;
                      const checkpoint = checkpoints.find(
                        (cp) => cp.checkpoint_number === checkpointNum
                      );

                      return (
                        <div
                          key={checkpointNum}
                          className="flex items-center flex-1"
                        >
                          <div className="flex-1 flex items-center justify-center">
                            {checkpoint?.checkpoint_passed === true ? (
                              <CheckCircle className="w-6 h-6 text-green-400" />
                            ) : checkpoint?.checkpoint_passed === false ? (
                              <AlertCircle className="w-6 h-6 text-red-400" />
                            ) : currentCheckpoint === checkpointNum ? (
                              <div
                                className={`w-6 h-6 rounded-full border-2 ${
                                  meetsCurrentRequirement
                                    ? "border-green-400 bg-green-400/20"
                                    : "border-blue-400 bg-blue-400/20"
                                }`}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-slate-600" />
                            )}
                          </div>
                          {checkpointNum < numCheckpoints && (
                            <div className="flex-1 h-0.5 bg-slate-600 mx-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Current Checkpoint Requirement */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">
                        Checkpoint {currentCheckpoint} Target (
                        {profitTargetPercent}%):
                      </span>
                    </div>
                    <span
                      className={`text-2xl font-semibold ${
                        meetsCurrentRequirement
                          ? "text-green-400"
                          : "text-slate-300"
                      }`}
                    >
                      $
                      {nextRequiredBalance.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                      {meetsCurrentRequirement ? " ✓" : ""}
                    </span>
                  </div>
                </div>
              );
            })()}

          {/* Account Stats Grid */}
          {(() => {
            const profitLoss = account.virtual_balance - account.account_size;
            const profitLossPercent = (profitLoss / account.account_size) * 100;
            const isProfit = profitLoss >= 0;
            // const progressPercent = (profitLoss / account.profit_target) * 100;
            // const dailyDDPercent =
            //   (account.dd_daily / account.account_size) * 100;
            const maxDDPercent = (account.dd_max / account.account_size) * 100;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">
                    Account Size
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      isAccountActive ? "text-white" : "text-slate-500"
                    }`}
                  >
                    ${account.account_size.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Profit/Loss</div>
                  <div
                    className={`text-lg font-semibold flex items-center space-x-1 ${
                      isProfit ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isProfit ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                      {isProfit ? "+" : ""}${profitLoss.toLocaleString()} (
                      {profitLossPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                {/* <div>
                  <div className="text-xs text-slate-400 mb-1">
                    Profit Target
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      isAccountActive ? "text-white" : "text-slate-500"
                    }`}
                  >
                    ${account.profit_target.toLocaleString()}
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        progressPercent >= 100 ? "bg-green-500" : "bg-blue-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.max(progressPercent, 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {Math.max(progressPercent, 0).toFixed(1)}% Complete
                  </div>
                </div> */}
                <div>
                  <div className="text-xs text-slate-400 mb-1">
                    Drawdown Limits
                  </div>
                  <div className="space-y-1">
                    {/* <div className="flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-yellow-400" />
                      <span className="text-sm text-slate-300">
                        Daily: ${account.dd_daily.toLocaleString()} (
                        {dailyDDPercent.toFixed(1)}%)
                      </span>
                    </div> */}
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <span className="text-sm text-slate-300">
                        Max: ${account.dd_max.toLocaleString()} (
                        {maxDDPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  BTC/USDT Price Chart
                </h3>
                <span className="text-xs text-slate-400">
                  Powered by TradingView
                </span>
              </div>
              <div className="bg-slate-900 rounded-lg overflow-hidden">
                <TradingViewChart
                  symbol="BINANCE:BTCUSDT"
                  theme="dark"
                  height={500}
                />
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex border-b border-slate-700 mb-4">
                <button
                  onClick={() => setActiveTab("positions")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "positions"
                      ? "text-blue-500 border-b-2 border-blue-500"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Positions ({positionsCount})
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "orders"
                      ? "text-blue-500 border-b-2 border-blue-500"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Open Orders ({ordersCount})
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "history"
                      ? "text-blue-500 border-b-2 border-blue-500"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Trade History
                </button>
              </div>

              {activeTab === "positions" && !!walletAddress && (
                <PositionsList
                  key={key}
                  address=""
                  accountId={accountId as string}
                  walletAddress={walletAddress}
                  isDisabled={!isAccountActive}
                  reloadData={reloadData}
                />
              )}
              {activeTab === "orders" && (
                <div className="text-center py-12 text-slate-400">
                  Orders not available in Phase 1 (simulated trading)
                </div>
              )}
              {activeTab === "history" && (
                <div className="text-center py-12 text-slate-400">
                  Trade history coming soon
                </div>
              )}
            </div>
          </div>

          <div>
            {walletAddress && isAccountActive && (
              <OrderForm
                accountId={accountId as string}
                walletAddress={walletAddress}
                currentPrice={currentPrice}
                privateKey={null}
                builderCode={null}
                isDisabled={!isAccountActive}
                onOrderPlaced={() => {
                  loadAccount();
                  loadCounts();
                  setKey(Date.now());
                }}
              />
            )}
            {walletAddress && !isAccountActive && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="text-center py-8">
                  <div
                    className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      account.status === "passed"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {account.status === "passed" ? "✓" : "✗"}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">
                    Trading Disabled
                  </h3>
                  <p className="text-sm text-slate-400">
                    {account.status === "passed"
                      ? "This account has completed the evaluation. You can view positions and history below."
                      : "This account has reached its limit. You can view positions and history below."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TradingPage;
