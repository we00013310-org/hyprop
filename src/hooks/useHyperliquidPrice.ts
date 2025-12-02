import { getDemoPriceOffset } from "@/lib/priceOracle";
import { useCallback, useEffect, useRef, useState } from "react";

// interface TradeData {
//   coin: string;
//   side: string;
//   px: string;
//   sz: string;
//   time: number;
// }

interface AllMidsData {
  mids: Record<string, string>;
}

interface PriceData {
  price: number;
  priceChange: number;
  isConnected: boolean;
}

const TESTNET_WS_URL = "wss://api.hyperliquid-testnet.xyz/ws";
const TESTNET_API_URL = "https://api.hyperliquid-testnet.xyz/info";

export function useHyperliquidPrice(coin: string = "BTC"): PriceData {
  const [price, setPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const previousPriceRef = useRef<number>(0);
  const basePriceRef = useRef<number>(0); // Store raw price without offset
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  const fetchInitialPrice = useCallback(async () => {
    try {
      const response = await fetch(TESTNET_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "allMids",
        }),
      });

      const data = await response.json();

      if (data && data[coin]) {
        const initialPrice = parseFloat(data[coin]);
        if (initialPrice && !isNaN(initialPrice)) {
          const demoOffset = getDemoPriceOffset();
          basePriceRef.current = initialPrice;
          setPrice(initialPrice + demoOffset);
          previousPriceRef.current = initialPrice;
          console.log(`Initial ${coin} price from REST API:`, initialPrice);
        }
      }
    } catch (error) {
      console.error("Failed to fetch initial price:", error);
    }
  }, [coin]);

  // Listen for localStorage changes (demo price offset)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "demo_btc_price_offset" && basePriceRef.current > 0) {
        const newOffset = e.newValue ? parseFloat(e.newValue) : 0;
        const adjustedPrice = basePriceRef.current +
          (isNaN(newOffset) ? 0 : newOffset);
        console.log(
          `Demo price offset changed to ${newOffset}, adjusting price to ${adjustedPrice}`,
        );
        setPrice(adjustedPrice);
      }
    };

    // Also poll for changes in the same tab (storage event only fires for other tabs)
    const pollInterval = setInterval(() => {
      if (basePriceRef.current > 0) {
        const currentOffset = getDemoPriceOffset();
        const expectedPrice = basePriceRef.current + currentOffset;
        // Only update if there's a significant difference (offset changed)
        if (Math.abs(price - expectedPrice) > 0.01) {
          console.log(
            `Demo price offset detected: adjusting price from ${price} to ${expectedPrice}`,
          );
          setPrice(expectedPrice);
        }
      }
    }, 1000); // Check every second

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [price]);

  useEffect(() => {
    fetchInitialPrice();

    const connectWebSocket = () => {
      try {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          return;
        }

        console.log(
          `Connecting to Hyperliquid testnet WebSocket for ${coin}...`,
        );
        const ws = new WebSocket(TESTNET_WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✓ Connected to Hyperliquid testnet");
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;

          ws.send(
            JSON.stringify({
              method: "subscribe",
              subscription: {
                type: "trades",
                coin: coin,
              },
            }),
          );
          console.log(`Subscribed to ${coin} trades`);

          ws.send(
            JSON.stringify({
              method: "subscribe",
              subscription: {
                type: "allMids",
              },
            }),
          );
          console.log("Subscribed to allMids");
        };

        ws.onmessage = (event) => {
          try {
            if (!event.data || event.data === "") {
              return;
            }

            const data = JSON.parse(event.data);

            if (data.channel === "trades" && data.data) {
              const trades = Array.isArray(data.data) ? data.data : [data.data];

              for (const trade of trades) {
                if (trade.coin === coin) {
                  const rawPrice = parseFloat(trade.px);
                  const demoOffset = getDemoPriceOffset();
                  const newPrice = rawPrice + demoOffset;

                  if (rawPrice && !isNaN(rawPrice)) {
                    const change = previousPriceRef.current
                      ? newPrice - previousPriceRef.current
                      : 0;

                    basePriceRef.current = rawPrice;
                    setPrice(newPrice);
                    setPriceChange(change);
                    previousPriceRef.current = newPrice;
                  }
                }
              }
            }

            if (data.channel === "allMids" && data.data) {
              const midsData = data.data as AllMidsData;
              if (midsData.mids && midsData.mids[coin]) {
                const midPrice = parseFloat(midsData.mids[coin]);

                if (midPrice && !isNaN(midPrice)) {
                  basePriceRef.current = midPrice;
                  if (price === 0) {
                    const demoOffset = getDemoPriceOffset();
                    setPrice(midPrice + demoOffset);
                    previousPriceRef.current = midPrice;
                  }
                }
              }
            }
          } catch (error) {
            console.error(
              "Error parsing WebSocket message:",
              error,
              event.data,
            );
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsConnected(false);
        };

        ws.onclose = (event) => {
          console.log("WebSocket closed:", event.code, event.reason);
          setIsConnected(false);
          wsRef.current = null;

          reconnectAttemptsRef.current++;
          const delay = Math.min(5000 * reconnectAttemptsRef.current, 30000);

          console.log(
            `Reconnecting in ${
              delay / 1000
            }s... (attempt ${reconnectAttemptsRef.current})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        };
      } catch (error) {
        console.error("Failed to connect to WebSocket:", error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [coin, fetchInitialPrice]);

  return { price, priceChange, isConnected };
}
