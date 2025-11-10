import { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  height?: number;
}

export function TradingViewChart({ 
  symbol = 'BINANCE:BTCUSDT', 
  theme = 'dark',
  height = 500 
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Generate unique ID for this widget instance
    const widgetId = `tradingview-${Math.random().toString(36).substr(2, 9)}`;
    containerRef.current.id = widgetId;

    // Check if TradingView script is already loaded
    const loadWidget = () => {
      if (window.TradingView && containerRef.current) {
        // Destroy existing widget if any
        if (widgetRef.current) {
          try {
            widgetRef.current.remove();
          } catch (e) {
            // Widget might not have remove method
          }
        }

        // Create new widget
        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: '15',
          timezone: 'Etc/UTC',
          theme: theme,
          style: '1', // Candlestick chart
          locale: 'en',
          toolbar_bg: '#1e293b', // Match slate-800
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: widgetId,
          height: height,
          width: '100%',
          hide_side_toolbar: false,
          save_image: false,
          studies: [
            'Volume@tv-basicstudies',
          ],
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          support_host: 'https://www.tradingview.com',
          backgroundColor: '#0f172a', // slate-900
        });

        setIsLoading(false);
      } else {
        // Script not loaded yet, wait a bit
        setTimeout(loadWidget, 100);
      }
    };

    // Load TradingView script if not already loaded
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = loadWidget;
      document.head.appendChild(script);
    } else {
      loadWidget();
    }

    return () => {
      // Cleanup widget on unmount
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [symbol, theme, height]);

  return (
    <div className="w-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div 
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: `${height}px`, minHeight: `${height}px` }}
      />
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    TradingView: any;
  }
}

