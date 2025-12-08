import { Copy, TrendingDown, TrendingUp } from "lucide-react";

import List from "@/components/ui/List";
import SectionWrapper from "@/components/ui/SectionWrapper";
import { FundedAccount, TestAccount } from "@/types";
import { formatWalletAddress } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";

interface AccountFormProps {
  account: TestAccount | FundedAccount;
}

const AccountForm = ({ account }: AccountFormProps) => {
  const isFundedAccount = !!(account as FundedAccount).test_account_id;
  const profitLoss = account.virtual_balance - account.account_size;
  const profitLossPercent = (profitLoss / account.account_size) * 100;
  const isProfit = profitLoss >= 0;
  const accAddress = (account as FundedAccount)?.account_address;
  const { success } = useToast();

  return (
    <div className="flex flex-col gap-4">
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
              label: "Type",
              value: `${isFundedAccount ? "[FUNDED]" : ""} ${
                account.account_mode
              }`,
            },
            {
              label: "Size",
              value: `$${account.account_size.toLocaleString()}`,
            },
            ...(isFundedAccount
              ? [
                  {
                    label: "AccAddr.",
                    value: (
                      <span className="flex gap-2">
                        <a
                          href={`https://hypurrscan.io/address/${accAddress}`}
                          target="_blank"
                          className="underline hover:opacity-65"
                        >
                          {formatWalletAddress(accAddress)}
                        </a>
                        {!!accAddress && (
                          <button
                            type="button"
                            className="cursor-pointer text-highlight hover:text-white"
                            onClick={() => {
                              navigator.clipboard.writeText(accAddress);
                              success("Copied");
                            }}
                            title="Copy address"
                          >
                            <Copy className="w-4" />
                          </button>
                        )}
                      </span>
                    ),
                  },
                ]
              : []),
            {
              label: (
                <span className="text-white font-medium">Perps Overview</span>
              ),
              value: (
                <span className="text-highlight">Est: 0% / Max: 8.00%</span>
              ),
            },
            {
              label: "Virtual Balance",
              value: `$${account.virtual_balance.toLocaleString()}`,
            },
            {
              label: "PNL",
              value: (
                <div
                  className={`font-semibold flex items-center space-x-1 ${
                    isProfit ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isProfit ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>
                    {isProfit ? "+" : "-"}$
                    {Math.abs(profitLoss).toLocaleString()} (
                    {profitLossPercent.toFixed(2)}%)
                  </span>
                </div>
              ),
            },
            {
              label: "High Water Mark",
              value: (
                <span className="text-highlight">
                  ${account.high_water_mark.toFixed(3)}
                </span>
              ),
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
              value: "1.00x",
            },
          ]}
        />
      </SectionWrapper>
    </div>
  );
};

export default AccountForm;
