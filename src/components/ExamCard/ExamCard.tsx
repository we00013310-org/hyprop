/* eslint-disable @typescript-eslint/no-explicit-any */
import clsx from "clsx";
import { useState } from "react";
import { useLocation } from "wouter";

import CardTag from "../ui/CardTag";
import { Button } from "../ui";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Exam } from "../../types";
import { useToast } from "../../contexts/ToastContext";
import {
  CHECKPOINT_INTERVAL_HOURS,
  CHECKPOINT_PROFIT_TARGET,
  NUM_CHECKPOINTS,
} from "../../configs";

import "./ExamCard.css";

const ExamDescriptionLine = ({
  label,
  value,
  isBasic,
  large = false,
  noBorder = false,
}: {
  label: string;
  value: string;
  isBasic: boolean;
  large?: boolean;
  noBorder?: boolean;
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
      <p className="text-textBtn">{label}</p>
      <p className={clsx("text-white", { "text-xl font-medium": large })}>
        {value}
      </p>
    </div>
  );
};

interface ExamCardProps {
  type?: "basic" | "pro";
  data: Exam;
}

const ExamCard = ({ type = "basic", data }: ExamCardProps) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

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

  const handlePurchase = async (data: Exam) => {
    if (!user) return;

    setLoading(true);

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

      success("Bought new Exam");
      setLocation("/");
    } catch (err: any) {
      error(err.message || "Failed to create test account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={clsx(
        "w-[400px] rounded-2xl p-5 flex flex-col gap-2 text-left transition-all hover:scale-105",
        bgCn,
        borderCn
      )}
    >
      <CardTag
        text={tagText}
        className="top-[-1.25rem] left-[-1.25rem]"
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
      />
      <ExamDescriptionLine
        isBasic={isBasic}
        label="Max. drawdown"
        value={`$${data.maxDD.toLocaleString()}`}
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
        <Button
          disabled={loading}
          fullWidth
          onClick={() => handlePurchase(data)}
        >
          Buy
        </Button>
      </div>
    </div>
  );
};

export default ExamCard;
