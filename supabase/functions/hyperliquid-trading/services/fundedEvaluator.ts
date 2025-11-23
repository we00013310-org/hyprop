import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type {
  FundedAccount,
  FundedCheckpoint,
  CheckpointEvaluationResult,
} from "../types.ts";
import { getFundedAccountInfo } from "./fundedAccount.ts";
import { DD_PCT, LEVERAGE, MAX_TRADE } from "../constants.ts";

function getEvaluationConfig(fundedAccount: FundedAccount) {
  return {
    numCheckpoints: fundedAccount.num_checkpoints || 3,
    checkpointIntervalHours: fundedAccount.checkpoint_interval_hours || 24,
    profitTargetPercent: fundedAccount.checkpoint_profit_target_percent || 8.0,
  };
}

function calculateTimeMetrics(
  createdAt: Date,
  checkpointIntervalHours: number
) {
  const now = new Date();
  const timeElapsed = now.getTime() - createdAt.getTime();
  const hoursElapsed = Math.floor(timeElapsed / 1000 / 60 / 60);
  const checkpointIntervalMs = checkpointIntervalHours * 60 * 60 * 1000;

  return { timeElapsed, hoursElapsed, checkpointIntervalMs };
}

function checkLossLimit(fundedAccount: FundedAccount): boolean {
  return fundedAccount.currentDD > DD_PCT;
}

async function loadCheckpoints(
  supabase: SupabaseClient,
  accountId: string
): Promise<Map<number, FundedCheckpoint>> {
  const { data: existingCheckpoints } = await supabase
    .from("funded_account_checkpoints")
    .select("*")
    .eq("funded_account_id", accountId)
    .order("checkpoint_number", { ascending: true });

  return new Map(
    (existingCheckpoints || []).map((cp: FundedCheckpoint) => [
      cp.checkpoint_number,
      cp,
    ])
  );
}

async function failAccount(
  supabase: SupabaseClient,
  accountId: string
): Promise<void> {
  await supabase
    .from("funded_accounts")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId);
}

async function passAccount(
  supabase: SupabaseClient,
  fundedAccount: FundedAccount,
  accountId: string
): Promise<void> {
  await supabase
    .from("funded_accounts")
    .update({
      status: "passed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId);

  // Log event for funded account passing all checkpoints
  await supabase.from("events").insert({
    user_id: fundedAccount.user_id,
    account_id: accountId,
    type: "funded_account_passed",
    payload: {
      funded_account_id: accountId,
      completion_timestamp: new Date().toISOString(),
    },
  });
}

async function evaluateCheckpoint(
  supabase: SupabaseClient,
  fundedAccount: FundedAccount,
  accountId: string,
  currentCheckpoint: number,
  checkpointMap: Map<number, FundedCheckpoint>,
  profitTargetPercent: number,
  numCheckpoints: number,
  timeElapsed: number,
  checkpointIntervalMs: number
): Promise<{ newStatus: string; shouldPass: boolean }> {
  const checkpointTimeMs = currentCheckpoint * checkpointIntervalMs;
  const isLastCheckpoint = currentCheckpoint === numCheckpoints;

  if (timeElapsed < checkpointTimeMs && !isLastCheckpoint) {
    return { newStatus: fundedAccount.status, shouldPass: false };
  }

  console.log(
    `Checking checkpoint ${currentCheckpoint}/${numCheckpoints} (${
      (fundedAccount.checkpoint_interval_hours || 24) * currentCheckpoint
    }h mark)`
  );

  let previousBalance = fundedAccount.account_size;
  if (currentCheckpoint > 1) {
    const previousCheckpoint = checkpointMap.get(currentCheckpoint - 1);
    if (previousCheckpoint?.checkpoint_balance) {
      previousBalance = parseFloat(
        previousCheckpoint.checkpoint_balance.toString()
      );
    }
  }

  const profitMultiplier = 1 + profitTargetPercent / 100;
  const requiredBalance = previousBalance * profitMultiplier;
  const checkpointPassed = fundedAccount.virtual_balance >= requiredBalance;

  console.log(
    `Checkpoint ${currentCheckpoint}: Current balance ${fundedAccount.virtual_balance}, Previous balance ${previousBalance}, Required ${requiredBalance}, Passed: ${checkpointPassed}`
  );

  await supabase.from("funded_account_checkpoints").upsert({
    funded_account_id: accountId,
    checkpoint_number: currentCheckpoint,
    checkpoint_balance: fundedAccount.virtual_balance,
    checkpoint_passed: checkpointPassed,
    checkpoint_ts: new Date().toISOString(),
    required_balance: requiredBalance,
  });

  if (checkpointPassed) {
    if (currentCheckpoint >= numCheckpoints) {
      console.log(
        `Checkpoint ${currentCheckpoint} passed - EVALUATION COMPLETE!`
      );
      await passAccount(supabase, fundedAccount, accountId);
      return { newStatus: "passed", shouldPass: true };
    } else {
      console.log(
        `Checkpoint ${currentCheckpoint} passed - Moving to checkpoint ${
          currentCheckpoint + 1
        }`
      );
      await supabase
        .from("funded_accounts")
        .update({
          current_checkpoint: currentCheckpoint + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", accountId);
      return { newStatus: fundedAccount.status, shouldPass: false };
    }
  } else {
    if (timeElapsed >= checkpointTimeMs) {
      console.log(
        `Checkpoint ${currentCheckpoint} failed - marking account as failed`
      );
      await failAccount(supabase, accountId);
      return { newStatus: "failed", shouldPass: false };
    }
    return { newStatus: fundedAccount.status, shouldPass: false };
  }
}

export async function checkFundedStatus(
  supabase: SupabaseClient,
  accountId: string
): Promise<CheckpointEvaluationResult> {
  console.log("=== CHECKING FUNDED STATUS (DYNAMIC EVALUATION) ===");

  const fundedAccount = await getFundedAccountInfo(supabase, accountId);
  const config = getEvaluationConfig(fundedAccount);
  console.log(
    `Evaluation config: ${config.numCheckpoints} checkpoints, ${config.checkpointIntervalHours}h intervals, ${config.profitTargetPercent}% profit target`
  );

  const createdAt = new Date(fundedAccount.created_at);
  const { timeElapsed, hoursElapsed, checkpointIntervalMs } =
    calculateTimeMetrics(createdAt, config.checkpointIntervalHours);

  const lossLimitHit = checkLossLimit(fundedAccount);
  let newStatus = fundedAccount.status;
  let shouldPass = false;

  const checkpointMap = await loadCheckpoints(supabase, accountId);

  if (fundedAccount.status === "active") {
    if (lossLimitHit) {
      console.log("Loss limit hit - marking account as failed");
      await failAccount(supabase, accountId);
      newStatus = "failed";
    } else {
      const currentCheckpoint = fundedAccount.current_checkpoint || 1;
      const result = await evaluateCheckpoint(
        supabase,
        fundedAccount,
        accountId,
        currentCheckpoint,
        checkpointMap,
        config.profitTargetPercent,
        config.numCheckpoints,
        timeElapsed,
        checkpointIntervalMs
      );
      newStatus = result.newStatus;
      shouldPass = result.shouldPass;
    }

    if (fundedAccount.virtual_balance > fundedAccount.high_water_mark) {
      await supabase
        .from("funded_accounts")
        .update({ high_water_mark: fundedAccount.virtual_balance })
        .eq("id", accountId);
    }
    await supabase
      .from("funded_accounts")
      .update({
        virtual_balance: fundedAccount.virtual_balance,
        dd_max: DD_PCT * fundedAccount.high_water_mark,
      })
      .eq("id", accountId);
  }

  const { data: finalCheckpoints } = await supabase
    .from("funded_account_checkpoints")
    .select("*")
    .eq("funded_account_id", accountId)
    .order("checkpoint_number", { ascending: true });

  return {
    status: newStatus,
    lossLimitHit,
    shouldPass,
    createdAt: fundedAccount.created_at,
    timeElapsed: hoursElapsed,
    evaluationConfig: {
      numCheckpoints: config.numCheckpoints,
      intervalHours: config.checkpointIntervalHours,
      profitTargetPercent: config.profitTargetPercent,
    },
    currentCheckpoint: fundedAccount.current_checkpoint || 1,
    checkpoints: finalCheckpoints || [],
  };
}
