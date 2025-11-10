import { useState, useEffect, useCallback } from "react";
import { X, RefreshCw, AlertTriangle } from "lucide-react";
import {
  getUserPositions,
  HyperliquidTrading,
} from "../../lib/hyperliquidTrading";
import {
  getRealBTCPriceWithFallback,
  calculateRealWorldPNL,
  calculatePNLPercentage,
} from "../../lib/priceOracle";

interface PositionsListProps {
  address: string;
  accountId: string;
  walletAddress: string;
  isDisabled?: boolean;
}

export function PositionsList({
  address,
  accountId,
  walletAddress,
  isDisabled = false,
}: PositionsListProps) {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [realBTCPrice, setRealBTCPrice] = useState<number | null>(null);
  const [closingPositions, setClosingPositions] = useState<Set<string>>(
    new Set()
  );

  const loadRealBTCPrice = async () => {
    try {
      const priceData = await getRealBTCPriceWithFallback();
      setRealBTCPrice(priceData.price);
    } catch (error) {
      console.error("Failed to load real BTC price:", error);
    }
  };

  const loadPositions = useCallback(async () => {
    setLoading(true);
    try {
      // PHASE 1: Get positions from database for test accounts
      const data = await getUserPositions(address, accountId, walletAddress);
      const openPositions = data.filter((pos: any) => {
        const size = parseFloat(pos.position?.szi || "0");
        return size !== 0;
      });
      setPositions(openPositions);
    } catch (error) {
      console.error("Failed to load positions:", error);
    } finally {
      setLoading(false);
    }
  }, [address, accountId, walletAddress]);

  const checkAndCloseLosingPositions = useCallback(async () => {
    // Don't auto-close if account is disabled (already passed/failed)
    if (positions.length === 0 || !accountId || !walletAddress || isDisabled)
      return;

    // PHASE 1: Update position PnL and let the backend handle auto-close
    const trading = new HyperliquidTrading(accountId, walletAddress);

    try {
      await trading.updatePositionPnL();
      // Reload positions after update
      setTimeout(() => {
        loadPositions();
      }, 1000);
    } catch (error) {
      console.error("Failed to update position PnL:", error);
    }
  }, [positions, accountId, walletAddress, isDisabled, loadPositions]);

  useEffect(() => {
    loadPositions();
    loadRealBTCPrice();
    const interval = setInterval(() => {
      // loadPositions();
      loadRealBTCPrice();
    }, 5000);
    return () => clearInterval(interval);
  }, [address, accountId, walletAddress, loadPositions]);

  // Check for auto-close when positions change (only for active accounts)
  useEffect(() => {
    if (positions.length > 0 && accountId && walletAddress && !isDisabled) {
      checkAndCloseLosingPositions();
    }
  }, [
    positions,
    accountId,
    walletAddress,
    isDisabled,
    checkAndCloseLosingPositions,
  ]);

  if (loading && positions.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">No open positions</div>
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
        const marginUsed = parseFloat(pos.position.marginUsed || 0);
        const unrealizedPnl = parseFloat(pos.position.unrealizedPnl || 0);
        const isLong = size > 0;
        const coin = pos.position.coin;

        // Calculate real-world PNL if we have real BTC price
        let realWorldPNL = unrealizedPnl;
        let realWorldPNLPercentage = 0;
        let usingRealPrice = false;

        if (realBTCPrice && coin === "BTC") {
          realWorldPNL = calculateRealWorldPNL(entryPx, realBTCPrice, size);
          realWorldPNLPercentage = calculatePNLPercentage(
            realWorldPNL,
            marginUsed
          );
          usingRealPrice = true;
        } else if (marginUsed > 0) {
          realWorldPNLPercentage = calculatePNLPercentage(
            unrealizedPnl,
            marginUsed
          );
        }

        const isLosing = realWorldPNL < 0;
        const lossExceedsThreshold = realWorldPNLPercentage < -5;
        const positionKey = `${coin}-${size}`;
        const isClosing = closingPositions.has(positionKey);

        return (
          <div
            key={`${pos.position.coin}-${index}`}
            className={`bg-slate-700 rounded-lg p-4 border ${
              lossExceedsThreshold
                ? "border-red-500 border-2"
                : "border-slate-600"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-white font-semibold">
                  {pos.position.coin}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    isLong
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {isLong ? "Long" : "Short"}
                </span>
                {usingRealPrice && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                    Real Price
                  </span>
                )}
                {lossExceedsThreshold && !isDisabled && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Auto-closing</span>
                  </span>
                )}
                {isDisabled && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-500/20 text-slate-400">
                    Read Only
                  </span>
                )}
              </div>
            </div>

            {lossExceedsThreshold && !isDisabled && (
              <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                <div className="flex items-center space-x-2 text-red-400 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    Loss exceeds 5% ({realWorldPNLPercentage.toFixed(2)}%).{" "}
                    {isClosing
                      ? "Closing position..."
                      : "Position will be closed automatically."}
                  </span>
                </div>
              </div>
            )}
            {lossExceedsThreshold && isDisabled && (
              <div className="mb-3 bg-slate-500/10 border border-slate-500/20 rounded-lg p-2">
                <div className="flex items-center space-x-2 text-slate-400 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    Loss exceeds 5% ({realWorldPNLPercentage.toFixed(2)}%).
                    Account is disabled - position cannot be closed.
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-400">Size</div>
                <div className="text-white font-medium">
                  {Math.abs(size).toFixed(4)}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Entry Price</div>
                <div className="text-white font-medium">
                  $
                  {entryPx.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div>
                <div className="text-slate-400">
                  {usingRealPrice ? "Real-World PnL" : "Unrealized PnL"}
                  {usingRealPrice && realBTCPrice && (
                    <span className="text-xs text-slate-500 ml-1">
                      (@ $
                      {realBTCPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      )
                    </span>
                  )}
                </div>
                <div
                  className={`font-medium ${
                    realWorldPNL >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {realWorldPNL >= 0 ? "+" : ""}$
                  {realWorldPNL.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  {marginUsed > 0 && (
                    <span className="text-xs ml-1">
                      ({realWorldPNLPercentage >= 0 ? "+" : ""}
                      {realWorldPNLPercentage.toFixed(2)}%)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Margin Used</div>
                <div className="text-white font-medium">
                  $
                  {marginUsed.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
