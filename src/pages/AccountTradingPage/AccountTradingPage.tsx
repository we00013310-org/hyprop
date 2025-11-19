import { useParams, useLocation } from "wouter";

import SectionWrapper from "../../components/ui/SectionWrapper";
import OrderForm from "./components/OrderForm";
import Chart from "./components/Chart";
import AccountForm from "./components/AccountForm";
import TargetInfo from "./components/TargetInfo";
import AccountTable from "./components/AccountTable/AccountTable";
import PassedSection from "./components/PassedSection";
import FailedSection from "./components/FailedSection";

import { useAccount } from "@/hooks/account";
import { useHyperliquidPrice } from "@/hooks/useHyperliquidPrice";
import { TestAccount } from "@/types";

interface AccountTradingPageProps {
  isFundedAccount: boolean;
}

const AccountTradingPage = ({ isFundedAccount }: AccountTradingPageProps) => {
  const { accountId } = useParams();
  const [, setLocation] = useLocation();

  const { data: account, isPending } = useAccount(
    accountId as string,
    isFundedAccount
  );
  const { price: currentPrice } = useHyperliquidPrice("BTC");
  const isPassed = account?.status === "passed";
  const isFailed = account?.status === "failed";

  const handleTryAgain = () => {
    // Redirect to new account page
    setLocation("/new-account");
  };

  if (isPending || !account) {
    return (
      <div className="flex p-4 gap-2 fade-in h-[50vh] w-full justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Show PassedSection if account has passed the evaluation (only for Test Account)
  if (isPassed) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PassedSection account={account as TestAccount} />
      </div>
    );
  }

  // Show FailedSection if account has failed the evaluation
  if (isFailed) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FailedSection
          account={account as TestAccount}
          onTryAgain={handleTryAgain}
          isFundedAccount={isFundedAccount}
        />
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
