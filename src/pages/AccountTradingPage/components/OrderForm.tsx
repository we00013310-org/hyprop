import { useMemo, useState, useEffect } from "react";
import clsx from "clsx";

import { Button } from "../../../components/ui";
import List from "../../../components/ui/List";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabs";
import SizeInput from "@/components/GroupInput/SizeInput";
import { Slider } from "@/components/ui/slider";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import SectionWrapper from "@/components/ui/SectionWrapper";
import { FundedAccount, TestAccount } from "@/types";
import { useCreateOrder } from "@/hooks/order";
import { usePositions } from "@/hooks/account";
import { useCreateTestOrder } from "@/hooks/useTestOrders";
import { useCreateFundedOrder } from "@/hooks/useFundedOrders";

enum TradeType {
  Market = "Market",
  Limit = "Limit",
  Pro = "Pro",
}

enum OrderType {
  Buy = "Buy",
  Sell = "Sell",
}

interface OrderFormProps {
  account: TestAccount | FundedAccount;
  currentPrice: number;
  token?: string;
}

const OrderForm = ({
  account,
  currentPrice,
  token = "BTC",
}: OrderFormProps) => {
  const isFundedAccount = !!(account as FundedAccount).test_account_id;
  const { data: positionsData } = usePositions(account.id, isFundedAccount);
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.Market);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.Buy);
  const [limitPrice, setLimitPrice] = useState<number>(0);

  const balance = useMemo(() => {
    if (isFundedAccount) {
      return (account as FundedAccount).available;
    }
    const usedBalance = positionsData?.reduce(
      (res: number, cur: { position: { szi: number; entryPx: number } }) => {
        return res + cur.position.szi * cur.position.entryPx;
      },
      0
    );

    return Math.max(0, account.virtual_balance - usedBalance);
  }, [account, isFundedAccount, positionsData]);

  const tokens = [token, "USD"];
  const [selectedToken, setSelectedToken] = useState(tokens[0]);
  const handleChangeSelectedToken = (newToken: string) => {
    handleChangePct(0);
    setSelectedToken(newToken);
  };

  const [size, setSize] = useState(0);

  const [reduceOnly, setReduceOnly] = useState(false);
  const [tpsl, setTpsl] = useState(false);
  const [tpPrice, setTpPrice] = useState<number>(0);
  const [slPrice, setSlPrice] = useState<number>(0);
  const [pct, setPct] = useState(0);

  // TP/SL Enhanced State
  const [tpGain, setTpGain] = useState<string>("");
  const [slLoss, setSlLoss] = useState<string>("");
  const [tpUnit, setTpUnit] = useState<"$" | "%">("$");
  const [slUnit, setSlUnit] = useState<"$" | "%">("$");

  const leverage = 20; // Default leverage
  const entryPrice = tradeType === TradeType.Limit ? limitPrice : currentPrice;
  const isBuy = orderType === OrderType.Buy;

  // Helper to calculate PnL given exit price
  const calculatePnL = (exitPrice: number) => {
    if (!size) return 0;
    return isBuy
      ? (exitPrice - entryPrice) * size
      : (entryPrice - exitPrice) * size;
  };

  // Helper to calculate ROE % given exit price
  const calculateRoe = (exitPrice: number) => {
    if (!size || !entryPrice) return 0;
    const margin = (size * entryPrice) / leverage;
    const pnl = calculatePnL(exitPrice);
    return (pnl / margin) * 100;
  };

  // Sync Gain/Loss when Price/Size/Unit changes
  useEffect(() => {
    if (tpPrice && entryPrice && size) {
      if (tpUnit === "$") {
        setTpGain(calculatePnL(tpPrice).toFixed(2));
      } else {
        setTpGain(calculateRoe(tpPrice).toFixed(2));
      }
    } else if (!tpPrice) {
      setTpGain("");
    }
  }, [tpPrice, tpUnit, size, entryPrice, isBuy]);

  useEffect(() => {
    if (slPrice && entryPrice && size) {
      if (slUnit === "$") {
        setSlLoss(calculatePnL(slPrice).toFixed(2));
      } else {
        setSlLoss(calculateRoe(slPrice).toFixed(2));
      }
    } else if (!slPrice) {
      setSlLoss("");
    }
  }, [slPrice, slUnit, size, entryPrice, isBuy]);


  // Calculate max size based on selected token
  const maxSize = useMemo(() => {
    if (selectedToken === "USD") {
      return balance;
    } else {
      // For token, max is balance / currentPrice (with 99.92% factor like slider at 100%)
      return +((0.9992 * balance) / currentPrice).toFixed(6);
    }
  }, [selectedToken, balance, currentPrice]);

  const handleChangePct = (newVal: number) => {
    if (selectedToken === "USD") {
      setSize(Math.floor((newVal * balance) / 100.0));
    } else {
      let tmpVal = newVal;
      if (tmpVal === 100) {
        tmpVal = 99.92;
      }
      setSize(+((tmpVal / 100.0) * (balance / currentPrice)).toFixed(6));
    }
    setPct(newVal);
  };

  // Handle size input change - calculate percentage from size
  const handleSizeChange = (newSize: number) => {
    setSize(newSize);

    // Calculate percentage based on the new size
    if (balance > 0) {
      let newPct: number;
      if (selectedToken === "USD") {
        newPct = (newSize / balance) * 100;
      } else {
        const sizeInUsd = newSize * currentPrice;
        newPct = (sizeInUsd / balance) * 100;
      }
      // Clamp percentage between 0 and 100
      setPct(Math.min(100, Math.max(0, Math.round(newPct))));
    }
  };

  const orderValue = useMemo(() => {
    if (selectedToken === "USD") {
      return size;
    } else {
      return Math.floor(size * currentPrice);
    }
  }, [currentPrice, selectedToken, size]);

  const { mutate, isPending } = useCreateOrder({
    accountId: account.id,
    onSuccess: () => {
      handleChangePct(0);
      setLimitPrice(0);
      setTpPrice(0);
      setSlPrice(0);
      setTpGain("");
      setSlLoss("");
    },
    isFundedAccount,
  });

  // Hook for creating limit orders for test accounts
  const { mutate: createTestOrder, isPending: isCreatingTestOrder } = useCreateTestOrder({
    testAccountId: account.id,
    onSuccess: () => {
      handleChangePct(0);
      setLimitPrice(0);
      setTpPrice(0);
      setSlPrice(0);
      setTpGain("");
      setSlLoss("");
    },
  });

  // Hook for creating limit orders for funded accounts
  const { mutate: createFundedOrder, isPending: isCreatingFundedOrder } = useCreateFundedOrder({
    fundedAccountId: account.id,
    onSuccess: () => {
      handleChangePct(0);
      setLimitPrice(0);
      setTpPrice(0);
      setSlPrice(0);
      setTpGain("");
      setSlLoss("");
    },
  });

  const handleSubmitOrder = () => {
    const tSize = orderValue / currentPrice;

    // For test accounts with limit orders, insert into test_orders table
    if (!isFundedAccount && tradeType === TradeType.Limit) {
      if (!limitPrice || limitPrice <= 0) {
        return;
      }

      createTestOrder({
        symbol: token,
        side: orderType === OrderType.Buy ? "buy" : "sell",
        size: tSize,
        price: limitPrice,
        order_type: "limit",
        reduce_only: reduceOnly,
        tp_price: tpPrice,
        sl_price: slPrice,
      });
      return;
    }

    // For funded accounts with limit orders, place real order on Hyperliquid
    if (isFundedAccount && tradeType === TradeType.Limit) {
      if (!limitPrice || limitPrice <= 0) {
        return;
      }

      createFundedOrder({
        symbol: token,
        side: orderType === OrderType.Buy ? "buy" : "sell",
        size: tSize,
        price: limitPrice,
        order_type: "limit",
        reduce_only: reduceOnly,
        tp_price: tpsl && tpPrice > 0 ? tpPrice : undefined,
        sl_price: tpsl && slPrice > 0 ? slPrice : undefined,
      });
      return;
    }

    // For market orders (both test and funded accounts), use existing flow
    mutate({
      side: orderType === OrderType.Buy ? "long" : "short",
      size: tSize,
      orderType: tradeType.toLowerCase(),
      currentPrice,
      limitPrice: tradeType === TradeType.Limit ? limitPrice : undefined,
      reduceOnly,
      token,
      tpPrice: tpsl && tpPrice > 0 ? tpPrice : undefined,
      slPrice: tpsl && slPrice > 0 ? slPrice : undefined,
    });
  };

  const isLimitOrder = tradeType === TradeType.Limit;
  const isSubmitDisabled = !size || (isLimitOrder && (!limitPrice || limitPrice <= 0));
  const isLoading = isPending || isCreatingTestOrder || isCreatingFundedOrder;

  const handleChangeTpPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setTpPrice(val);
    // Update Gain immediately
    if (val && size && entryPrice) {
      if (tpUnit === "$") {
        setTpGain(isBuy ? ((val - entryPrice) * size).toFixed(2) : ((entryPrice - val) * size).toFixed(2));
      } else {
        const margin = (size * entryPrice) / leverage;
        const pnl = isBuy ? (val - entryPrice) * size : (entryPrice - val) * size;
        setTpGain(((pnl / margin) * 100).toFixed(2));
      }
    } else {
      setTpGain("");
    }
  };

  const handleChangeSlPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSlPrice(val);
    // Update Loss immediately
    if (val && size && entryPrice) {
      if (slUnit === "$") {
        setSlLoss(isBuy ? ((val - entryPrice) * size).toFixed(2) : ((entryPrice - val) * size).toFixed(2));
      } else {
        const margin = (size * entryPrice) / leverage;
        const pnl = isBuy ? (val - entryPrice) * size : (entryPrice - val) * size;
        setSlLoss(((pnl / margin) * 100).toFixed(2));
      }
    } else {
      setSlLoss("");
    }
  };

  const handleChangeTpGainInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTpGain(val);
    const numVal = parseFloat(val);
    if (!isNaN(numVal) && size && entryPrice) {
      let newPrice = 0;
      if (tpUnit === "$") {
        newPrice = isBuy ? entryPrice + numVal / size : entryPrice - numVal / size;
      } else {
        const margin = (size * entryPrice) / leverage;
        const pnl = (numVal * margin) / 100;
        newPrice = isBuy ? entryPrice + pnl / size : entryPrice - pnl / size;
      }
      setTpPrice(parseFloat(newPrice.toFixed(2)));
    }
  };

  const handleChangeTpUnitInput = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value as "$" | "%";
    setTpUnit(newUnit);
    // Recalculate Gain value based on current Price
    if (tpPrice && size && entryPrice) {
      if (newUnit === "$") {
        const pnl = isBuy ? (tpPrice - entryPrice) * size : (entryPrice - tpPrice) * size;
        setTpGain(pnl.toFixed(2));
      } else {
        const margin = (size * entryPrice) / leverage;
        const pnl = isBuy ? (tpPrice - entryPrice) * size : (entryPrice - tpPrice) * size;
        setTpGain(((pnl / margin) * 100).toFixed(2));
      }
    }
  };

  const handleChangeSlGainInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSlLoss(val);
    const numVal = parseFloat(val);
    if (!isNaN(numVal) && size && entryPrice) {
      let newPrice = 0;
      if (slUnit === "$") {
        newPrice = isBuy ? entryPrice + numVal / size : entryPrice - numVal / size;
      } else {
        const margin = (size * entryPrice) / leverage;
        const pnl = (numVal * margin) / 100;
        newPrice = isBuy ? entryPrice + pnl / size : entryPrice - pnl / size;
      }
      setSlPrice(parseFloat(newPrice.toFixed(2)));
    }
  };

  const handleChangeSlUnitInput = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value as "$" | "%";
    setSlUnit(newUnit);
    // Recalculate Loss value based on current Price
    if (slPrice && size && entryPrice) {
      if (newUnit === "$") {
        const pnl = isBuy ? (slPrice - entryPrice) * size : (entryPrice - slPrice) * size;
        setSlLoss(pnl.toFixed(2));
      } else {
        const margin = (size * entryPrice) / leverage;
        const pnl = isBuy ? (slPrice - entryPrice) * size : (entryPrice - slPrice) * size;
        setSlLoss(((pnl / margin) * 100).toFixed(2));
      }
    }
  };

  return (
    <>
      <div className="w-full flex justify-between gap-2">
        <div className="flex-1">
          <Button fullWidth>Isolated</Button>
        </div>
        <div className="flex-1">
          <Button fullWidth>1x</Button>
        </div>
        <div className="flex-1">
          <Button fullWidth>One-Way</Button>
        </div>
      </div>

      <div className="w-full flex justify-between my-3">
        {Object.values(TradeType).map((o) => {
          const isActive = tradeType === o;

          return (
            <div
              className={clsx("flex-1", {
                "border-b border-activeBorder": isActive,
                "border-b-[0.6px] border-textBtn": !isActive,
              })}
              key={o}
            >
              <Button
                className={clsx({
                  "text-white": isActive,
                })}
                onClick={() => setTradeType(o)}
                variant="ghost"
                fullWidth
              >
                {o}
              </Button>
            </div>
          );
        })}
      </div>

      <List
        data={[
          {
            label: "Available to Trade",
            value: `$${balance.toLocaleString()}`,
          },
        ]}
      />

      <Tabs
        value={orderType}
        onValueChange={(e) => setOrderType(e as OrderType)}
      >
        <TabsList className="w-full bg-cardBgDark my-2">
          <TabsTrigger
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer"
            value={OrderType.Buy}
          >
            {OrderType.Buy}
          </TabsTrigger>
          <TabsTrigger
            className="flex-1 data-[state=active]:bg-red-400 data-[state=active]:text-white cursor-pointer"
            value={OrderType.Sell}
          >
            {OrderType.Sell}
          </TabsTrigger>
        </TabsList>

        <SizeInput
          value={size}
          max={maxSize}
          onChange={handleSizeChange}
          onChangeToken={handleChangeSelectedToken}
          tokens={tokens}
        />

        {/* Limit Price Input - Only show for Limit orders */}
        {isLimitOrder && (
          <div className="my-2">
            <label className="text-sm text-gray-400 mb-1 block">Limit Price</label>
            <InputGroup>
              <InputGroupInput
                type="number"
                placeholder="Enter limit price"
                value={limitPrice || ""}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                min={0}
                step={0.01}
              />
              <InputGroupAddon align="inline-end">USD</InputGroupAddon>
            </InputGroup>
          </div>
        )}

        <div className="flex items-center gap-2 my-2">
          <Slider
            onValueChange={(o) => handleChangePct(o[0])}
            className="my-2"
            value={[pct]}
            max={100}
            step={1}
          />
          <InputGroup className="w-[120px]">
            <InputGroupInput
              type="number"
              onChange={(o) => handleChangePct(+o.target.value)}
              value={pct}
              min={0}
              max={100}
            />
            <InputGroupAddon align="inline-end">%</InputGroupAddon>
          </InputGroup>
        </div>

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reduceOnly}
              onChange={(e) => setReduceOnly(e.target.checked)}
              className="w-4 h-4 rounded border-tradingBorder bg-tradingBgDark checked:bg-tradingGreen appearance-none cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-xs checked:after:left-1/2 checked:after:top-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2"
            />
            <span className="text-white text-sm">Reduce Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={tpsl}
              onChange={(e) => setTpsl(e.target.checked)}
              className="w-4 h-4 rounded border-tradingBorder bg-tradingBgDark checked:bg-tradingGreen appearance-none cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-xs checked:after:left-1/2 checked:after:top-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2"
            />
            <span className="text-white text-sm">Take Profit / Stop Loss</span>
          </label>
        </div>


        {/* TP/SL Inputs - Only show when tpsl checkbox is checked */}
        {tpsl && (
          <div className="my-2 space-y-2 fade-in">
            {/* Take Profit Row */}
            <div className="flex gap-2">
              <div className="flex-1">
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    placeholder="TP Price"
                    value={tpPrice || ""}
                    onChange={handleChangeTpPriceInput}
                    min={0}
                    step={0.01}
                  />
                </InputGroup>
              </div>
              <div className="flex-1">
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    placeholder="Gain"
                    value={tpGain}
                    onChange={handleChangeTpGainInput}
                  />
                  <div className="pr-2">
                    <select
                      className="bg-transparent text-xs h-full px-2 outline-none text-gray-400 cursor-pointer"
                      value={tpUnit}
                      onChange={handleChangeTpUnitInput}
                    >
                      <option value="$">$</option>
                      <option value="%">%</option>
                    </select>
                  </div>
                </InputGroup>
              </div>
            </div>

            {/* Stop Loss Row */}
            <div className="flex gap-2">
              <div className="flex-1">
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    placeholder="SL Price"
                    value={slPrice || ""}
                    onChange={handleChangeSlPriceInput}
                    min={0}
                    step={0.01}
                  />
                </InputGroup>
              </div>
              <div className="flex-1">
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    placeholder="Loss"
                    value={slLoss}
                    onChange={handleChangeSlGainInput}
                  />
                  <div className="pr-2">
                    <select
                      className="bg-transparent text-xs h-full px-2 outline-none text-gray-400 cursor-pointer"
                      value={slUnit}
                      onChange={handleChangeSlUnitInput}
                    >
                      <option value="$">$</option>
                      <option value="%">%</option>
                    </select>
                  </div>
                </InputGroup>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 w-full">
          <Button
            disabled={isSubmitDisabled}
            fullWidth
            loading={isLoading}
            onClick={handleSubmitOrder}
          >
            {isLimitOrder ? "Place Limit Order" : "Place Order"}
          </Button>
        </div>

        <SectionWrapper className="mt-2 bg-cardBgDarker!">
          <List
            data={[
              {
                label: "Current Price",
                value: `$${currentPrice.toLocaleString()}`,
              },
              ...(isLimitOrder && limitPrice > 0
                ? [
                  {
                    label: "Limit Price",
                    value: `$${limitPrice.toLocaleString()}`,
                  },
                ]
                : []),
              {
                label: "Order Value",
                value: `$${orderValue}`,
              },
              {
                label: "Margin Value",
                value: `$${orderValue}`,
              },
              {
                label: "Slippage",
                value: (
                  <span className="text-highlight">Est: 0% / Max: 8.00%</span>
                ),
              },
            ]}
          />
        </SectionWrapper>
      </Tabs>
    </>
  );
};

export default OrderForm;
