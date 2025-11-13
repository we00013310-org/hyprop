import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Inbox, Plus } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { AccountSelection } from "./AccountSelection";
import { FundedAccountCard } from "./FundedAccountCard";
import { getBuilderFees } from "../../lib/hyperliquidApi";
import { useAccounts } from "../../hooks/useAccounts";
import Spinner from "../ui/Spinner";
import { Button } from "../ui";
import { AccountCard } from "../AccountCard/AccountCard";

import feeIcon from "../../assets/icons/ic_fee.svg";

export function Dashboard() {
  const [, setLocation] = useLocation();
  const { walletAddress } = useAuth();
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const { loadAccounts, testAccounts, fundedAccounts, loading } = useAccounts();
  const [builderFees, setBuilderFees] = useState<number>(0);
  const [loadingFees, setLoadingFees] = useState(true);

  useEffect(() => {
    if (walletAddress) {
      loadAccounts();
      loadBuilderFees();
    }
  }, [loadAccounts, walletAddress]);

  const loadBuilderFees = async () => {
    try {
      const BUILDER_ADDRESS = "0x7c4E42B6cDDcEfa029D230137908aB178D52d324";
      const fees = await getBuilderFees(BUILDER_ADDRESS);
      setBuilderFees(fees);
    } catch (error) {
      console.error("Error loading builder fees:", error);
    } finally {
      setLoadingFees(false);
    }
  };

  return (
    <div>
      <main className="fade-in max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-20">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-medium text-white mb-2">
                Dashboard
              </h2>
              <p className="text-textBtn text-sm">
                Manage your trading accounts and evaluations
              </p>
            </div>
            {/* Button */}
            <div className="rounded-2xl p-4 border border-btnBorder btn-blur-bg">
              <div className="flex items-center gap-2">
                <img src={feeIcon} />
                <div className="flex flex-col gap-1">
                  <span className="text-textBtn text-sm">Rebate Collected</span>
                  {loadingFees ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                      <span className="text-textBtn text-sm">Loading...</span>
                    </div>
                  ) : (
                    <div className="text-3xl font-medium text-white">
                      ${builderFees.toFixed(4)}{" "}
                      <span className="text-sm font-normal text-textBtn">
                        USDC
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-medium text-white mb-4">
                Funded Accounts
              </h3>
              {!fundedAccounts.length ? (
                <div className="bg-sectionBg rounded-2xl p-6 flex justify-center items-center gap-2 text-sm">
                  <Inbox className="text-textDark w-4" />
                  <p className="text-textBtn">
                    No funded accounts yet. Pass an evaluation to get funded
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {fundedAccounts.map((account) => (
                    <FundedAccountCard key={account.id} account={account} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Test Accounts
                </h3>

                <Button
                  onClick={() => setLocation("/new-account")}
                  leftIcon={<Plus />}
                  size="lg"
                >
                  New Account
                </Button>
              </div>
              {!testAccounts.length ? (
                <div className="bg-sectionBg rounded-2xl p-6 flex flex-col justify-center items-center gap-2 text-sm">
                  <div className="flex justify-center items-center gap-2">
                    <Inbox className="text-textDark w-4" />
                    <p className="text-textBtn">
                      No exam accounts yet. Start your trading journey!
                    </p>
                  </div>
                  <Button
                    onClick={() => setLocation("/new-account")}
                    leftIcon={<Plus />}
                    size="lg"
                  >
                    New Account
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {testAccounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onUpdate={loadAccounts}
                      onOpenTrading={() =>
                        setLocation(`/trading/${account.id}`)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showAccountSelection && (
        <AccountSelection
          onClose={() => setShowAccountSelection(false)}
          onSuccess={() => {
            setShowAccountSelection(false);
            loadAccounts();
          }}
        />
      )}
    </div>
  );
}
