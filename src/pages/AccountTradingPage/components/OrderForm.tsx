import { useState } from "react";
import clsx from "clsx";

import { Button } from "../../../components/ui";
import List from "../../../components/ui/List";
import { USD } from "../../../configs";
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

enum TradeType {
  Market = "Market",
  Limit = "Limit",
  Pro = "Pro",
}

enum OrderType {
  Buy = "Buy",
  Sell = "Sell",
}

const OrderForm = () => {
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.Market);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.Buy);
  const balance = 5000;
  const tokens = ["BTC", "USDC"];

  const [reduceOnly, setReduceOnly] = useState(false);
  const [tpsl, setTpsl] = useState(true);

  const [pct, setPct] = useState(0);

  return (
    <>
      <div className="w-full flex justify-between gap-2">
        <div className="flex-1">
          <Button fullWidth>Cross</Button>
        </div>
        <div className="flex-1">
          <Button fullWidth>20x</Button>
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
            value: `${balance.toLocaleString()} ${USD}`,
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

        <SizeInput tokens={tokens} />

        <div className="flex items-center gap-2 my-2">
          <Slider
            onValueChange={(o) => setPct(o[0])}
            className="my-2"
            value={[pct]}
            max={100}
            step={1}
          />
          <InputGroup className="w-[120px]">
            <InputGroupInput
              type="number"
              onChange={(o) => setPct(+o.target.value)}
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

        <div className="mt-8 w-full">
          <Button fullWidth>Place Order</Button>
        </div>

        <SectionWrapper className="mt-2 bg-cardBgDarker!">
          <List
            data={[
              {
                label: "Liquidation Price",
                value: "N/A",
              },
              {
                label: "Order Value",
                value: "N/A",
              },
              {
                label: "Margin Value",
                value: "N/A",
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
