import { Database } from "../lib/database.types";

export type TestAccount = Database["public"]["Tables"]["test_accounts"]["Row"];
export type FundedAccount =
  Database["public"]["Tables"]["funded_accounts"]["Row"];

export type User = Database["public"]["Tables"]["users"]["Row"];
