import { useParams } from "wouter";

import SectionWrapper from "../../components/ui/SectionWrapper";
import OrderForm from "./components/OrderForm";
import Chart from "./components/Chart";
import AccountForm from "./components/AccountForm";
import TargetInfo from "./components/TargetInfo";
import AccountTable from "./components/AccountTable/AccountTable";

import { useTestAccount } from "@/hooks/testAccount";
import { useHyperliquidPrice } from "@/hooks/useHyperliquidPrice";

const AccountTradingPage = () => {
  const { accountId } = useParams();

  const { data: account, isPending } = useTestAccount(accountId as string);
  const { price: currentPrice } = useHyperliquidPrice("BTC");

  if (isPending || !account) {
    return (
      <div className="flex p-4 gap-2 fade-in">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex p-4 gap-2 fade-in">
      <div className="w-[800px] xl:w-[1192px] flex flex-col gap-2">
        <SectionWrapper className="w-full h-fit">
          <Chart token="BTC" />
        </SectionWrapper>
        <SectionWrapper className="w-full">
          <AccountTable currentPrice={currentPrice} account={account} />
        </SectionWrapper>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <SectionWrapper>
          <OrderForm account={account} currentPrice={currentPrice} />
        </SectionWrapper>
        <SectionWrapper>
          <AccountForm account={account} />
        </SectionWrapper>
        <SectionWrapper>
          <TargetInfo account={account} />
        </SectionWrapper>
      </div>
    </div>
  );
};

export default AccountTradingPage;
