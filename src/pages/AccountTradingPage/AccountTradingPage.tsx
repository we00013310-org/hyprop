import { useState } from "react";

import SectionWrapper from "../../components/ui/SectionWrapper";
import OrderForm from "./components/OrderForm";
import Chart from "./components/Chart";
import AccountForm from "./components/AccountForm";
import TargetInfo from "./components/TargetInfo";
import AccountTable from "./components/AccountTable/AccountTable";

const AccountTradingPage = () => {
  const [orderType, setOrderType] = useState<"cross" | "20x" | "one-way">(
    "cross"
  );
  const [tradeType, setTradeType] = useState<"market" | "limit" | "pro">(
    "market"
  );
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [size, setSize] = useState("0");
  const [sizePercentage, setSizePercentage] = useState(0);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [tpsl, setTpsl] = useState(true);
  const [accountType, setAccountType] = useState<"perps" | "spot">("perps");

  return (
    <div className="flex p-4 gap-2">
      <div className="w-[800px] xl:w-[1192px] flex flex-col gap-2">
        <SectionWrapper className="w-full h-fit">
          <Chart token="BTC" />
        </SectionWrapper>
        <SectionWrapper className="w-full">
          <AccountTable />
        </SectionWrapper>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <SectionWrapper>
          <OrderForm />
        </SectionWrapper>
        <SectionWrapper>
          <AccountForm />
        </SectionWrapper>
        <SectionWrapper>
          <TargetInfo />
        </SectionWrapper>
      </div>
    </div>
  );
};

export default AccountTradingPage;
