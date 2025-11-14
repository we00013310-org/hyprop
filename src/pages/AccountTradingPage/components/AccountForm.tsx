import { ArrowLeftRight } from "lucide-react";

import List from "@/components/ui/List";
import { Button } from "@/components/ui/MyButton";
import SectionWrapper from "@/components/ui/SectionWrapper";

const AccountForm = () => {
  return (
    <div className="flex flex-col gap-4">
      <Button className="bg-highlight! text-outlineBg!" fullWidth>
        Deposit
      </Button>

      <div className="flex w-full gap-2">
        <Button variant="outline" className="flex-1">
          Perps
          <ArrowLeftRight className="w-4" />
          Spot
        </Button>
        <Button variant="outline" className="flex-1">
          Withdraw
        </Button>
      </div>

      <SectionWrapper className="mt-2 bg-cardBgDarker!">
        <List
          data={[
            {
              label: (
                <span className="text-white font-medium">Account Equity</span>
              ),
              value: "",
            },
            {
              label: "Spot",
              value: "$0.00",
            },
            {
              label: "Perps",
              value: "$0.00",
            },
            {
              label: (
                <span className="text-white font-medium">Perps Overview</span>
              ),
              value: (
                <span className="text-highlight">Est: 0% / Max: 8.00%</span>
              ),
            },
            {
              label: "Balance",
              value: "$0.00",
            },
            {
              label: "Unrealized PNL",
              value: "$0.00",
            },
            {
              label: "Cross Margin Ratio",
              value: <span className="text-highlight">$0.00</span>,
            },
            {
              label: "Maintenance Margin",
              value: "$0.00",
            },
            {
              label: "Cross Account Leverage",
              value: "0.00x",
            },
          ]}
        />
      </SectionWrapper>
    </div>
  );
};

export default AccountForm;
