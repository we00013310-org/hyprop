export const NUM_CHECKPOINTS = 3;
export const CHECKPOINT_INTERVAL_HOURS = 8;
export const CHECKPOINT_PROFIT_TARGET = 8.0; // percent

export const ACCOUNT_TIERS = {
  "1-step": [
    { id: 1, size: 5000, fee: 60, target: 500, dailyLoss: 0.04, maxDD: 300 },
  ],
  "2-step": [
    { id: 2, size: 5000, fee: 50, target: 500, dailyLoss: 0.05, maxDD: 400 },
  ],
};
