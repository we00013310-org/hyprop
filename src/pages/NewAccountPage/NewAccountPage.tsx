import ExamCard from "../../components/ExamCard/ExamCard";
import { ACCOUNT_TIERS } from "../../configs";

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
  const basicAccounts = ACCOUNT_TIERS["1-step"];
  const proAccounts = ACCOUNT_TIERS["2-step"];

  const acc1Step = basicAccounts[0];
  const acc2Step = proAccounts[0];

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
            <ExamCard key={o.id} data={o} />
          ))}
          {proAccounts.map((o) => (
            <ExamCard key={o.id} data={o} type="pro" />
          ))}
        </div>

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
              <div className="flex-1 text-textFeature text-left">
                Daily Loss
              </div>
              <div className="flex-1 text-center">{`${(
                acc1Step.dailyLoss * 100
              ).toFixed(0)}%`}</div>
              <div className="flex-1 text-center">{`${(
                acc2Step.dailyLoss * 100
              ).toFixed(0)}%`}</div>
            </div>
            <div className="flex border-b-[0.6px] border-btnBorder py-4 text-white">
              <div className="flex-1 text-textFeature text-left">
                Max. drawdown
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
