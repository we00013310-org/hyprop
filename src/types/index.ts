import { Database } from "../lib/database.types";

export type TestAccount = Database["public"]["Tables"]["test_accounts"]["Row"];
export type FundedAccount =
  Database["public"]["Tables"]["funded_accounts"]["Row"];

export type User = Database["public"]["Tables"]["users"]["Row"];

export type Exam = {
  id: number;
  size: number;
  fee: number;
  target: number;
  dailyLoss: number;
  maxDD: number;
};
export type Checkpoint =
  Database["public"]["Tables"]["test_account_checkpoints"]["Row"];
