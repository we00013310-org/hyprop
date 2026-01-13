import clsx from "clsx";

import CardTag from "../ui/CardTag";
import { Button } from "../ui";
import { Exam } from "../../types";

import "./ExamCard.css";
import MyTooltip from "../Tooltip/MyTooltip";
import { HelpCircle } from "lucide-react";

const ExamDescriptionLine = ({
  label,
  value,
  isBasic,
  large = false,
  noBorder = false,
  explain,
}: {
  label: string;
  value: string;
  isBasic: boolean;
  large?: boolean;
  noBorder?: boolean;
  explain?: string;
}) => {
  const borderCn = clsx({
    "border-lightBorder": isBasic,
    "border-btnBorder": !isBasic,
    "border-none": noBorder,
  });

  return (
    <div
      className={`flex justify-between items-center border-b-[0.6px] ${borderCn} py-2`}
    >
      <p className="text-textBtn flex gap-1 items-center">
        {label}
        {!!explain && (
          <MyTooltip content={explain}>
            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help" />
          </MyTooltip>
        )}
      </p>
      <p className={clsx("text-white", { "text-xl font-medium": large })}>
        {value}
      </p>
    </div>
  );
};

interface ExamCardProps {
  type?: "basic" | "pro";
  data: Exam;
  onClick: (exam: Exam, isBasic: boolean) => void;
}

const ExamCard = ({ type = "basic", data, onClick }: ExamCardProps) => {
  const isBasic = type === "basic";
  const borderCn = clsx("border-[0.6px]", {
    "border-cardBg": isBasic,
    "border-tagNormalBg": !isBasic,
  });
  const tagText = isBasic ? "Basic Account" : "Pro Account";
  const bgCn = clsx({
    "bg-cardBg": isBasic,
    "card-pro-bg": !isBasic,
  });

  return (
    <div
      className={clsx(
        "w-[400px] rounded-2xl p-5 flex flex-col gap-2 text-left transition-all hover:scale-105 cursor-pointer",
        bgCn,
        borderCn
      )}
      onClick={() => onClick(data, isBasic)}
    >
      <CardTag
        text={tagText}
        className="-top-5 -left-5"
        variant={isBasic ? "dark" : "normal"}
      />

      <p className="text-white text-4xl mb-4">${data.size.toLocaleString()}</p>
      <ExamDescriptionLine
        isBasic={isBasic}
        label="Your Profit Share"
        value="Up to 90%	"
      />
      <ExamDescriptionLine
        isBasic={isBasic}
        label="Step 1 Goal"
        value={`$${(!isBasic
          ? data.target / 2
          : data.target
        ).toLocaleString()}`}
      />
      <ExamDescriptionLine
        isBasic={isBasic}
        label="Step 2 Goal"
        value={isBasic ? "-" : `$${data.target.toLocaleString()}`}
      />
      <ExamDescriptionLine
        isBasic={isBasic}
        label="Daily loss"
        value={`${(data.dailyLoss * 100).toFixed(0)}%`}
        explain="Daily loss limit is based on the prior day's balance. This number is recalculated every day (00:30 UTC). If your equity reaches or declines below the maximum daily loss, the account will be in breach (all positions closed, account permanently disabled)."
      />
      <ExamDescriptionLine
        isBasic={isBasic}
        label="Max. drawdown"
        value={`$${data.maxDD.toLocaleString()}`}
        explain="Maximum overall loss equity limit. 1-Step maximum drawdown is static. 2-Step maximum drawdown trails your highest balance. If your equity limit reaches or falls below the maximum drawdown equity limit, the account will breach (all positions closed, account permanently disabled)."
      />
      <ExamDescriptionLine
        isBasic={isBasic}
        label="Leverage"
        value="Up to 5:1"
      />
      <ExamDescriptionLine
        isBasic={isBasic}
        label="Evaluation fee"
        value={`$${data.fee.toLocaleString()}`}
        large
        noBorder
      />
      <div className="mt-2 flex w-full justify-center items-center">
        <Button fullWidth>Buy</Button>
      </div>
    </div>
  );
};

export default ExamCard;
