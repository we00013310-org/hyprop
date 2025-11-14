import { useState } from "react";

import SectionWrapper from "../../components/ui/SectionWrapper";
import OrderForm from "./components/OrderForm";
import Chart from "./components/Chart";

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
    <div className="bg-primary-background flex p-4 gap-2">
      <SectionWrapper className="w-[800px] xl:w-[1192px] h-fit">
        <Chart token="BTC" />
      </SectionWrapper>
      <SectionWrapper className="flex-1">
        <OrderForm />
      </SectionWrapper>
    </div>
  );
};

export default AccountTradingPage;
