import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type {
  TestAccount,
  Checkpoint,
  CheckpointEvaluationResult,
} from "../types.ts";
import { createFundedAccount } from "./accountCreator.ts";

function getEvaluationConfig(testAccount: TestAccount) {
  return {
    numCheckpoints: testAccount.num_checkpoints || 3,
    checkpointIntervalHours: testAccount.checkpoint_interval_hours || 24,
    profitTargetPercent: testAccount.checkpoint_profit_target_percent || 8.0,
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

function checkLossLimit(testAccount: TestAccount): boolean {
  const lossLimit = testAccount.account_size * (1 - testAccount.dd_max / 100);
  return testAccount.virtual_balance < lossLimit;
}

async function loadCheckpoints(
  supabase: SupabaseClient,
  accountId: string
): Promise<Map<number, Checkpoint>> {
  const { data: existingCheckpoints } = await supabase
    .from("test_account_checkpoints")
    .select("*")
    .eq("test_account_id", accountId)
    .order("checkpoint_number", { ascending: true });

  return new Map(
    (existingCheckpoints || []).map((cp: Checkpoint) => [
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
    .from("test_accounts")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId);
}

async function passAccount(
  supabase: SupabaseClient,
  testAccount: TestAccount,
  accountId: string
): Promise<void> {
  await supabase
    .from("test_accounts")
    .update({
      status: "passed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId);

  await createFundedAccount(testAccount, supabase);
}

async function evaluateCheckpoint(
  supabase: SupabaseClient,
  testAccount: TestAccount,
  accountId: string,
  currentCheckpoint: number,
  checkpointMap: Map<number, Checkpoint>,
  profitTargetPercent: number,
  numCheckpoints: number,
  timeElapsed: number,
  checkpointIntervalMs: number
): Promise<{ newStatus: string; shouldPass: boolean }> {
  const checkpointTimeMs = currentCheckpoint * checkpointIntervalMs;
  const isLastCheckpoint = currentCheckpoint === numCheckpoints;

  if (timeElapsed < checkpointTimeMs && !isLastCheckpoint) {
    return { newStatus: testAccount.status, shouldPass: false };
  }

  // console.log(
  //   `Checking checkpoint ${currentCheckpoint}/${numCheckpoints} (${
  //     (testAccount.checkpoint_interval_hours || 24) * currentCheckpoint
  //   }h mark)`
  // );

  let previousBalance = testAccount.account_size;
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
  const checkpointPassed = testAccount.virtual_balance >= requiredBalance;

  console.log(
    `Checkpoint ${currentCheckpoint}: Current balance ${testAccount.virtual_balance}, Previous balance ${previousBalance}, Required ${requiredBalance}, Passed: ${checkpointPassed}`
  );

  await supabase.from("test_account_checkpoints").upsert({
    test_account_id: accountId,
    checkpoint_number: currentCheckpoint,
    checkpoint_balance: testAccount.virtual_balance,
    checkpoint_passed: checkpointPassed,
    checkpoint_ts: new Date().toISOString(),
    required_balance: requiredBalance,
  });

  if (checkpointPassed) {
    if (currentCheckpoint >= numCheckpoints) {
      console.log(
        `Checkpoint ${currentCheckpoint} passed - EVALUATION COMPLETE!`
      );
      await passAccount(supabase, testAccount, accountId);
      return { newStatus: "passed", shouldPass: true };
    } else {
      console.log(
        `Checkpoint ${currentCheckpoint} passed - Moving to checkpoint ${
          currentCheckpoint + 1
        }`
      );
      await supabase
        .from("test_accounts")
        .update({
          current_checkpoint: currentCheckpoint + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", accountId);
      return { newStatus: testAccount.status, shouldPass: false };
    }
  } else {
    if (timeElapsed >= checkpointTimeMs) {
      console.log(
        `Checkpoint ${currentCheckpoint} failed - marking account as failed`
      );
      await failAccount(supabase, accountId);
      return { newStatus: "failed", shouldPass: false };
    }
    return { newStatus: testAccount.status, shouldPass: false };
  }
}

export async function checkTestStatus(
  supabase: SupabaseClient,
  accountId: string
): Promise<CheckpointEvaluationResult> {
  console.log("=== CHECKING TEST STATUS (DYNAMIC EVALUATION) ===");

  const { data: testAccount } = await supabase
    .from("test_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (!testAccount) {
    throw new Error("Test account not found");
  }

  const config = getEvaluationConfig(testAccount);
  console.log(
    `Evaluation config: ${config.numCheckpoints} checkpoints, ${config.checkpointIntervalHours}h intervals, ${config.profitTargetPercent}% profit target`
  );

  const createdAt = new Date(testAccount.created_at);
  const { timeElapsed, hoursElapsed, checkpointIntervalMs } =
    calculateTimeMetrics(createdAt, config.checkpointIntervalHours);

  const lossLimitHit = checkLossLimit(testAccount);
  let newStatus = testAccount.status;
  let shouldPass = false;

  const checkpointMap = await loadCheckpoints(supabase, accountId);

  if (testAccount.status === "active") {
    if (lossLimitHit) {
      console.log("Loss limit hit - marking account as failed");
      await failAccount(supabase, accountId);
      newStatus = "failed";
    } else {
      const currentCheckpoint = testAccount.current_checkpoint || 1;
      const result = await evaluateCheckpoint(
        supabase,
        testAccount,
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
  }

  const { data: finalCheckpoints } = await supabase
    .from("test_account_checkpoints")
    .select("*")
    .eq("test_account_id", accountId)
    .order("checkpoint_number", { ascending: true });

  return {
    status: newStatus,
    lossLimitHit,
    shouldPass,
    createdAt: testAccount.created_at,
    timeElapsed: hoursElapsed,
    evaluationConfig: {
      numCheckpoints: config.numCheckpoints,
      intervalHours: config.checkpointIntervalHours,
      profitTargetPercent: config.profitTargetPercent,
    },
    currentCheckpoint: testAccount.current_checkpoint || 1,
    checkpoints: finalCheckpoints || [],
  };
}
