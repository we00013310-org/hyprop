/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { ArrowLeft, AlertTriangle, DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

import { getRealBTCPriceWithFallback } from "../../lib/priceOracle";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../../components/ui";
import MySpinner from "../../components/ui/MySpinner";

export default function DemoSettingsPage() {
  const toast = useToast();
  const [priceOffset, setPriceOffset] = useState<string>("");
  const [currentOffset, setCurrentOffset] = useState<number>(0);
  const [realPrice, setRealPrice] = useState<number | null>(null);
  const [adjustedPrice, setAdjustedPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Load current offset from database
    loadOffsetFromDatabase();
    // Fetch current price
    fetchPrice();
  }, []);

  const loadOffsetFromDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from("config")
        .select("value")
        .eq("key", "demo_btc_price_offset")
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        const offset = parseFloat(data.value as string);
        if (!isNaN(offset)) {
          setCurrentOffset(offset);
          setPriceOffset(offset.toString());
          // Also update localStorage for frontend price oracle
          localStorage.setItem("demo_btc_price_offset", offset.toString());
        }
      }
    } catch (error) {
      console.error("Failed to load offset from database:", error);
    }
  };

  const fetchPrice = async () => {
    setLoading(true);
    try {
      const data = await getRealBTCPriceWithFallback();
      setAdjustedPrice(data.price);

      // Calculate real price (remove current offset)
      const offset = parseFloat(
        localStorage.getItem("demo_btc_price_offset") || "0"
      );
      setRealPrice(data.price - offset);
    } catch (error) {
      console.error("Failed to fetch price:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyOffset = async () => {
    const offset = parseFloat(priceOffset);
    if (isNaN(offset)) {
      toast.error("Please enter a valid number");
      return;
    }

    try {
      setLoading(true);

      // Save to database
      const { error } = await supabase.from("config").upsert({
        key: "demo_btc_price_offset",
        value: offset.toString(),
      });

      if (error) throw error;

      // Also save to localStorage for frontend
      localStorage.setItem("demo_btc_price_offset", offset.toString());
      setCurrentOffset(offset);
      await fetchPrice();
      toast.success(
        `Price offset set to ${
          offset >= 0 ? "+" : ""
        }${offset}. This will affect all PnL calculations including backend operations.`,
        5000
      );
    } catch (error: any) {
      console.error("Failed to save offset:", error);
      toast.error(`Failed to save offset: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearOffset = async () => {
    try {
      setLoading(true);

      // Delete from database
      const { error } = await supabase
        .from("config")
        .delete()
        .eq("key", "demo_btc_price_offset");

      if (error) throw error;

      // Also clear from localStorage
      localStorage.removeItem("demo_btc_price_offset");
      setCurrentOffset(0);
      setPriceOffset("");
      await fetchPrice();
      toast.success("Price offset cleared");
    } catch (error: any) {
      console.error("Failed to clear offset:", error);
      toast.error(
        `Failed to clear offset: ${error.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const previewPrice =
    realPrice && priceOffset
      ? realPrice + parseFloat(priceOffset || "0")
      : null;

  return (
    <div className="min-h-screen bg-primaryBg text-white">
      <main className="fade-in max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setLocation("/")}
            className="p-3 hover:bg-sectionBg rounded-2xl border border-btnBorder transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-medium text-white">Demo Settings</h1>
            <p className="text-textBtn text-sm mt-1">
              Testing tools for price simulation
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-8 flex items-start gap-4 fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/30">
            <AlertTriangle className="text-yellow-500 w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-yellow-400 text-lg">Demo Mode Only</h3>
            <p className="text-sm text-textBtn mt-2">
              This page is for testing purposes only. The price offset will
              affect all BTC prices displayed in the application and PnL
              calculations for simulated positions.
            </p>
          </div>
        </div>

        {/* Current Price Info */}
        <div className="bg-sectionBg rounded-2xl border border-btnBorder p-6 lg:p-8 mb-8 fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Current BTC Price</h2>
            <Button
              onClick={fetchPrice}
              disabled={loading}
              loading={loading}
              size="md"
              variant="outline"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-primaryBg rounded-2xl border border-btnBorder p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-sectionBg rounded-xl border border-btnBorder">
                  <DollarSign className="w-5 h-5 text-textBtn" />
                </div>
                <div className="text-sm text-textBtn">Real Price</div>
              </div>
              <div className="text-3xl font-bold text-white">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <MySpinner />
                  </div>
                ) : realPrice ? (
                  `$${realPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                ) : (
                  <span className="text-textBtn">--</span>
                )}
              </div>
            </div>
            <div className="bg-primaryBg rounded-2xl border border-btnBorder p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-sectionBg rounded-xl border border-btnBorder">
                  <TrendingUp className="w-5 h-5 text-highlight" />
                </div>
                <div className="text-sm text-textBtn">
                  Adjusted Price (with offset)
                </div>
              </div>
              <div className="text-3xl font-bold text-white">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <MySpinner />
                  </div>
                ) : adjustedPrice ? (
                  <>
                    <span
                      className={currentOffset !== 0 ? "text-highlight" : ""}
                    >
                      $
                      {adjustedPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    {currentOffset !== 0 && (
                      <span className="text-base text-highlight ml-2">
                        ({currentOffset > 0 ? "+" : ""}
                        {currentOffset})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-textBtn">--</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Price Offset Control */}
        <div className="bg-sectionBg rounded-2xl border border-btnBorder p-6 lg:p-8 fade-in" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-xl font-semibold text-white mb-4">Price Offset Control</h2>
          <p className="text-textBtn text-sm mb-6">
            Enter a number to adjust the BTC price. Positive values increase the
            price, negative values decrease it. For example, entering -5000 will
            reduce the BTC price by $5,000.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Price Offset (USD)
              </label>
              <input
                type="number"
                value={priceOffset}
                onChange={(e) => setPriceOffset(e.target.value)}
                placeholder="e.g., -5000"
                className="w-full bg-primaryBg border border-btnBorder rounded-2xl px-4 py-3 text-white placeholder-textBtn focus:outline-none focus:ring-2 focus:ring-highlight focus:border-transparent transition-all"
              />
            </div>

            {priceOffset && !isNaN(parseFloat(priceOffset)) && previewPrice && (
              <div className="bg-primaryBg rounded-2xl border border-btnBorder p-6 fade-in">
                <div className="text-sm text-textBtn mb-2">Preview Price</div>
                <div className="text-2xl font-bold text-highlight">
                  $
                  {previewPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  <span className="text-base ml-2">
                    ({parseFloat(priceOffset) > 0 ? "+" : ""}
                    {parseFloat(priceOffset)})
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleApplyOffset}
                disabled={!priceOffset || isNaN(parseFloat(priceOffset))}
                loading={loading}
                size="lg"
                fullWidth
              >
                Apply Offset
              </Button>
              <Button
                onClick={handleClearOffset}
                disabled={currentOffset === 0 || loading}
                size="lg"
                fullWidth
                variant="outline"
              >
                Clear Offset
              </Button>
            </div>

            {currentOffset !== 0 && (
              <div className="text-center py-3 px-4 bg-primaryBg rounded-2xl border border-btnBorder">
                <span className="text-sm text-textBtn">Current offset: </span>
                <span className="text-sm font-semibold text-highlight">
                  {currentOffset > 0 ? "+" : ""}
                  {currentOffset} USD
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Examples */}
        <div className="mt-8 bg-sectionBg/50 rounded-2xl border border-btnBorder p-6 lg:p-8 fade-in" style={{ animationDelay: "0.4s" }}>
          <h3 className="text-lg font-semibold text-white mb-4">Examples</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-highlight rounded-full mt-2"></div>
              <span className="text-textBtn">
                Enter{" "}
                <code className="bg-primaryBg border border-btnBorder px-2 py-1 rounded-lg text-white font-mono">
                  -5000
                </code>{" "}
                to decrease BTC price by $5,000
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-highlight rounded-full mt-2"></div>
              <span className="text-textBtn">
                Enter{" "}
                <code className="bg-primaryBg border border-btnBorder px-2 py-1 rounded-lg text-white font-mono">
                  10000
                </code>{" "}
                to increase BTC price by $10,000
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-highlight rounded-full mt-2"></div>
              <span className="text-textBtn">
                Enter{" "}
                <code className="bg-primaryBg border border-btnBorder px-2 py-1 rounded-lg text-white font-mono">
                  0
                </code>{" "}
                or clear to use real price
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
