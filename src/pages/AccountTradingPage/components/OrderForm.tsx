import { useState } from "react";
import clsx from "clsx";

import { Button } from "../../../components/ui";
import List from "../../../components/ui/List";
import { USD } from "../../../configs";

enum TradeType {
  Market = "Market",
  Limit = "Limit",
  Pro = "Pro",
}

const OrderForm = () => {
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.Market);
  const balance = 5000;

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
    </>
  );
};

export default OrderForm;
