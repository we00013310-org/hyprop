/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useLocation } from "wouter";
import { HelpCircle } from "lucide-react";

import ExamCard from "../../components/ExamCard/ExamCard";
import PaymentModal from "./components/PaymentModal/PaymentModal";
import MyTooltip from "../../components/Tooltip/MyTooltip";
import {
  ACCOUNT_TIERS,
  CHECKPOINT_INTERVAL_HOURS,
  CHECKPOINT_PROFIT_TARGET,
  NUM_CHECKPOINTS,
} from "../../configs";
import { Exam } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

import ApplePay from "../../assets/brands/apple-pay.svg";
import GooglePay from "../../assets/brands/google-pay.svg";
import Paypal from "../../assets/brands/paypal.svg";
import Visa from "../../assets/brands/visa.svg";
import Mastercard from "../../assets/brands/mastercard.svg";

import CryptoPay1 from "../../assets/crypto-pay/1.svg";
import CryptoPay2 from "../../assets/crypto-pay/2.svg";
import CryptoPay3 from "../../assets/crypto-pay/3.svg";
import CryptoPay4 from "../../assets/crypto-pay/4.svg";
import CryptoPay5 from "../../assets/crypto-pay/5.svg";

const NewAccountPage = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [, setLocation] = useLocation();

  const basicAccounts = ACCOUNT_TIERS["1-step"];
  const proAccounts = ACCOUNT_TIERS["2-step"];

  const acc1Step = basicAccounts[0];
  const acc2Step = proAccounts[0];

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedIsBasic, setSelectedIsBasic] = useState(true);

  const handleExamCardClick = (exam: Exam, isBasic: boolean) => {
    setSelectedExam(exam);
    setSelectedIsBasic(isBasic);
    setIsPaymentModalOpen(true);
  };

  const handlePurchase = async (data: Exam, isBasic: boolean) => {
    if (!user) return;

    try {
      const { error: insertError } = await supabase
        .from("test_accounts")
        .insert({
          user_id: user.id,
          account_size: data.size,
          account_mode: !isBasic ? "2-step" : "1-step",
          fee_paid: data.fee,
          virtual_balance: data.size,
          dd_max: data.maxDD,
          dd_daily: data.size * data.dailyLoss,
          profit_target: data.target,
          high_water_mark: data.size,
          num_checkpoints: NUM_CHECKPOINTS,
          checkpoint_interval_hours: CHECKPOINT_INTERVAL_HOURS,
          checkpoint_profit_target_percent: CHECKPOINT_PROFIT_TARGET,
          status: "active",
        });

      if (insertError) throw insertError;

      success("Created new Test Account");
      setLocation("/");
    } catch (err: any) {
      error(err.message || "Failed to create test account");
    }
  };

  return (
    <div>
      <main className="fade-in max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-20 flex flex-col gap-10 items-center text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-medium text-white mb-2 font-poppins">
            Start Exam
          </h1>
          <p className="text-subtitle text-lg">
            Unlock your potential by creating an account with Breakout today!
            Experience the benefits of trading with
            <br />
            our capital and take your first step towards financial freedom.
          </p>
        </div>

        <div className="flex gap-4">
          {basicAccounts.map((o) => (
            <ExamCard key={o.id} data={o} onClick={handleExamCardClick} />
          ))}
          {proAccounts.map((o) => (
            <ExamCard
              key={o.id}
              data={o}
              type="pro"
              onClick={handleExamCardClick}
            />
          ))}
        </div>

        {/* Payment Modal */}
        {selectedExam && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            examData={selectedExam}
            isBasic={selectedIsBasic}
            onSubmit={handlePurchase}
          />
        )}

        {/* Payment Section */}
        <div className="flex flex-col items-center mt-12 gap-8">
          <p className="text-subtitle text-lg">
            For your security, all orders are processed via Stripe or PayPal.
          </p>
          <div className="flex justify-center items-center gap-12">
            <img src={Visa} alt="visa" />
            <img src={Mastercard} alt="mastercard" />
            <img src={ApplePay} alt="apple pay" />
            <img src={GooglePay} alt="google pay" />
            <img src={Paypal} alt="paypal" />
          </div>
          <p className="text-subtitle text-lg">Pay via crypto</p>
          <div className="flex justify-center items-center gap-12">
            <img src={CryptoPay1} alt="cryptopay 1" />
            <img src={CryptoPay2} alt="cryptopay 2" />
            <img src={CryptoPay3} alt="cryptopay 3" />
            <img src={CryptoPay4} alt="cryptopay 4" />
            <img src={CryptoPay5} alt="cryptopay 5" />
          </div>
        </div>

        {/* Compare features */}
        <div className="flex flex-col items-center gap-8 mt-16 w-full">
          <h1 className="text-5xl font-medium text-white font-poppins">
            Compare features
          </h1>

          <div className="flex flex-col w-full">
            <div className="flex border-b-[0.6px] border-btnBorder py-4 font-medium font-poppins text-2xl text-white">
              <div className="flex-1"></div>
              <div className="flex-1">1-Step</div>
              <div className="flex-1">2-Step</div>
            </div>
            <div className="flex border-b-[0.6px] border-btnBorder py-4 text-white">
              <div className="flex-1 text-textFeature text-left">
                Your Profit Share
              </div>
              <div className="flex-1 text-center">Up to 90%</div>
              <div className="flex-1 text-center">Up to 90%</div>
            </div>
            <div className="flex border-b-[0.6px] border-btnBorder py-4 text-white">
              <div className="flex-1 text-textFeature text-left">
                Step 1 Goal
              </div>
              <div className="flex-1 text-center">{`$${acc1Step.target.toLocaleString()}`}</div>
              <div className="flex-1 text-center">{`$${(
                acc1Step.target / 2
              ).toLocaleString()}`}</div>
            </div>
            <div className="flex border-b-[0.6px] border-btnBorder py-4 text-white">
              <div className="flex-1 text-textFeature text-left">
                Step 2 Goal
              </div>
              <div className="flex-1 text-center">-</div>
              <div className="flex-1 text-center">{`$${acc1Step.target.toLocaleString()}`}</div>
            </div>
            <div className="flex border-b-[0.6px] border-btnBorder py-4 text-white">
              <div className="flex-1 text-textFeature text-left flex items-center gap-2">
                Daily Loss
                <MyTooltip content="Daily loss limit is based on the prior day's balance. This number is recalculated every day (00:30 UTC). If your equity reaches or declines below the maximum daily loss, the account will be in breach (all positions closed, account permanently disabled).">
                  <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help" />
                </MyTooltip>
              </div>
              <div className="flex-1 text-center">{`${(
                acc1Step.dailyLoss * 100
              ).toFixed(0)}%`}</div>
              <div className="flex-1 text-center">{`${(
                acc2Step.dailyLoss * 100
              ).toFixed(0)}%`}</div>
            </div>
            <div className="flex border-b-[0.6px] border-btnBorder py-4 text-white">
              <div className="flex-1 text-textFeature text-left flex items-center gap-2">
                Max. drawdown
                <MyTooltip content="Maximum overall loss equity limit. 1-Step maximum drawdown is static. 2-Step maximum drawdown trails your highest balance. If your equity limit reaches or falls below the maximum drawdown equity limit, the account will breach (all positions closed, account permanently disabled).">
                  <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help" />
                </MyTooltip>
              </div>
              <div className="flex-1 text-center">{`$${acc1Step.maxDD.toLocaleString()}`}</div>
              <div className="flex-1 text-center">{`$${acc2Step.maxDD.toLocaleString()}`}</div>
            </div>
            <div className="flex border-b-[0.6px] border-btnBorder py-4 text-white">
              <div className="flex-1 text-textFeature text-left">Leverage</div>
              <div className="flex-1 text-center">Up to 5:1</div>
              <div className="flex-1 text-center">Up to 5:1</div>
            </div>
            <div className="flex border-b-[0.6px] border-btnBorder py-4 text-white">
              <div className="flex-1 text-textFeature text-left">
                Evaluation fee
              </div>
              <div className="flex-1 text-center text-2xl">{`$${acc1Step.fee.toLocaleString()}`}</div>
              <div className="flex-1 text-center text-2xl">{`$${acc2Step.fee.toLocaleString()}`}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewAccountPage;
