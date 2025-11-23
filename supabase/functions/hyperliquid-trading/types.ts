/* eslint-disable @typescript-eslint/no-explicit-any */
// Import generated database types
import type { Database } from "../_shared/database.types.ts";

// Re-export table types for convenience
export type TestAccount = Database["public"]["Tables"]["test_accounts"]["Row"];
export type TestPosition =
  Database["public"]["Tables"]["test_positions"]["Row"];
export type Checkpoint =
  Database["public"]["Tables"]["test_account_checkpoints"]["Row"];
export type FundedCheckpoint =
  Database["public"]["Tables"]["funded_account_checkpoints"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type FundedAccount =
  Database["public"]["Tables"]["funded_accounts"]["Row"] & {
    used: number;
    available: number;
    oldVirtualBalance: number;
    currentDD: number;
  };

export interface PlaceOrderAction {
  type: "placeOrder" | "placeFundedOrder";
  coin: string;
  isBuy: boolean;
  size: string;
  price?: string;
  orderType: "market" | "limit";
  reduceOnly?: boolean;
}

export interface GetTestAccountAction {
  type: "getTestAccount";
}

export interface GetFundedAccountAction {
  type: "getFundedAccount";
}

export interface CancelOrderAction {
  type: "cancelOrder";
  orderId?: string;
}

export interface CancelAllOrdersAction {
  type: "cancelAllOrders";
}

export interface GetTestPositionsAction {
  type: "getTestPositions";
}

export interface GetFundedPositionsAction {
  type: "getFundedPositions";
}

export interface UpdatePositionPnLAction {
  type: "updatePositionPnL";
}

export interface UpdateFundedPositionPnLAction {
  type: "updateFundedPositionPnL";
}

export interface CheckTestStatusAction {
  type: "checkTestStatus";
}

export interface CheckFundedStatusAction {
  type: "checkFundedStatus";
}

export interface FailFundedAccountAction {
  type: "failFundedAccount";
}

export type Action =
  | PlaceOrderAction
  | CancelOrderAction
  | CancelAllOrdersAction
  | GetTestPositionsAction
  | GetFundedPositionsAction
  | UpdatePositionPnLAction
  | UpdateFundedPositionPnLAction
  | CheckTestStatusAction
  | CheckFundedStatusAction
  | GetFundedAccountAction
  | GetTestAccountAction
  | FailFundedAccountAction;

export interface CheckpointEvaluationResult {
  status: string;
  lossLimitHit: boolean;
  shouldPass: boolean;
  createdAt: string;
  timeElapsed: number;
  evaluationConfig: {
    numCheckpoints: number;
    intervalHours: number;
    profitTargetPercent: number;
  };
  currentCheckpoint: number;
  checkpoints: Checkpoint[];
}

interface CumFunding {
  allTime: string;
  sinceChange: string;
  sinceOpen: string;
}

interface LeverageInfo {
  rawUsd: string;
  type: string; // e.g. "cross" or "isolated"
  value: number; // leverage value (e.g. “20” for 20×)
}

export interface Position {
  coin: string;
  szi: string; // size of position (positive = long, negative = short)
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  marginUsed: string;
  liquidationPx: string;
  maxLeverage: number;
  leverage: LeverageInfo;
  cumFunding: CumFunding;
}

interface AssetPosition {
  position: Position;
  type: string; // e.g. "oneWay"
}

interface MarginSummary {
  accountValue: string;
  totalNtlPos: string;
  totalRawUsd: string;
  totalMarginUsed: string;
}

export interface ClearinghouseStateResponse {
  assetPositions: AssetPosition[];
  crossMaintenanceMarginUsed: string;
  crossMarginSummary: MarginSummary;
  marginSummary: MarginSummary;
  withdrawable: string;
  time: number;
}
