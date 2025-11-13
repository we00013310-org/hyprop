import ExamCard from "../../components/ExamCard/ExamCard";
import { ACCOUNT_TIERS } from "../../configs";

const NewAccountPage = () => {
  const basicAccounts = ACCOUNT_TIERS["1-step"];
  const proAccounts = ACCOUNT_TIERS["2-step"];

  return (
    <div>
      <main className="fade-in max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-20 flex flex-col gap-10 items-center text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-medium text-white mb-2">Start Exam</h1>
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
      </main>
    </div>
  );
};

export default NewAccountPage;
