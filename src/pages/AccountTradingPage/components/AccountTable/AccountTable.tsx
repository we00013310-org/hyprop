import { Button } from "@/components/ui/MyButton";
import clsx from "clsx";
import { useCallback, useState } from "react";

import PositionTable from "./PositionTable";
import ComingSoon from "./ComingSoon";
import { TestAccount } from "@/types";

enum Tab {
  Balances = "Balances",
  Positions = "Positions",
  OpenOrders = "Open Orders",
  TWAP = "TWAP",
  TradeHistory = "Trade History",
  OrderHistory = "Order History",
}

interface AccountTableProps {
  account: TestAccount;
  currentPrice: number;
}

const AccountTable = ({ account, currentPrice }: AccountTableProps) => {
  const [tab, setTab] = useState<Tab>(Tab.Positions);

  const renderContent = useCallback(() => {
    switch (tab) {
      case Tab.Positions:
        return (
          <PositionTable
            accountId={account.id as string}
            currentPrice={currentPrice}
          />
        );
      default:
        return <ComingSoon />;
    }
  }, [account.id, currentPrice, tab]);

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="w-full flex justify-between border-b-[0.6px] border-textBtn">
        {Object.values(Tab).map((o) => {
          const isActive = tab === o;

          return (
            <div
              className={clsx("flex-1", {
                "border-b border-activeBorder": isActive,
              })}
              key={o}
            >
              <Button
                className={clsx("text-xs", {
                  "text-white": isActive,
                })}
                onClick={() => setTab(o)}
                variant="ghost"
                fullWidth
              >
                {o}
              </Button>
            </div>
          );
        })}
      </div>
      {renderContent()}
    </div>
  );
};

export default AccountTable;
