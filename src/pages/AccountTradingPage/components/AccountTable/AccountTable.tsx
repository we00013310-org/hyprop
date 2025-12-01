import { Button } from "@/components/ui/MyButton";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import PositionTable from "./PositionTable";
import OpenOrdersTable from "./OpenOrdersTable";
import ComingSoon from "./ComingSoon";
import { FundedAccount, TestAccount } from "@/types";

enum Tab {
  Balances = "Balances",
  Positions = "Positions",
  OpenOrders = "Open Orders",
  TWAP = "TWAP",
  TradeHistory = "Trade History",
  OrderHistory = "Order History",
}

interface AccountTableProps {
  account: TestAccount | FundedAccount;
  currentPrice: number;
}

const AccountTable = ({ account, currentPrice }: AccountTableProps) => {
  const [tab, setTab] = useState<Tab>(Tab.Positions);
  const isFundedAccount = useMemo(
    () => !!(account as FundedAccount).test_account_id,
    [account]
  );

  const renderContent = useCallback(() => {
    switch (tab) {
      case Tab.Positions:
        return (
          <PositionTable
            accountId={account.id as string}
            currentPrice={currentPrice}
            isFundedAccount={isFundedAccount}
          />
        );
      case Tab.OpenOrders:
        // Only show open orders for test accounts (not funded accounts)
        if (isFundedAccount) {
          return (
            <span className="flex flex-col justify-center items-center gap-1 h-58">
              <ComingSoon />
            </span>
          );
        }
        return (
          <OpenOrdersTable
            testAccountId={account.id as string}
            currentPrice={currentPrice}
          />
        );
      default:
        return (
          <span className="flex flex-col justify-center items-center gap-1 h-58">
            <ComingSoon />
          </span>
        );
    }
  }, [account.id, currentPrice, isFundedAccount, tab]);

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
