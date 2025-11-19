// Import generated database types
import type { Database } from "../_shared/database.types.ts";

// Re-export table types for convenience
export type TestAccount = Database['public']['Tables']['test_accounts']['Row'];
export type TestPosition = Database['public']['Tables']['test_positions']['Row'];
export type Checkpoint = Database['public']['Tables']['test_account_checkpoints']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type FundedAccount = Database['public']['Tables']['funded_accounts']['Row'];

export interface PlaceOrderAction {
  type: "placeOrder";
  coin: string;
  isBuy: boolean;
  size: string;
  price?: string;
  orderType: "market" | "limit";
  reduceOnly?: boolean;
}

export interface CancelOrderAction {
  type: "cancelOrder";
  orderId?: string;
}

export interface CancelAllOrdersAction {
  type: "cancelAllOrders";
}

export interface ApproveBuilderFeeAction {
  type: "approveBuilderFee";
}

export interface GetBuilderFeesAction {
  type: "getBuilderFees";
}

export interface GetTestPositionsAction {
  type: "getTestPositions";
}

export interface UpdatePositionPnLAction {
  type: "updatePositionPnL";
}

export interface CheckTestStatusAction {
  type: "checkTestStatus";
}

export type Action =
  | PlaceOrderAction
  | CancelOrderAction
  | CancelAllOrdersAction
  | ApproveBuilderFeeAction
  | GetBuilderFeesAction
  | GetTestPositionsAction
  | UpdatePositionPnLAction
  | CheckTestStatusAction;

export interface PositionSimulationResult {
  success: boolean;
  position: TestPosition | null;
  realizedPnL: number;
  tradingFee: number;
  newBalance: number;
}

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
