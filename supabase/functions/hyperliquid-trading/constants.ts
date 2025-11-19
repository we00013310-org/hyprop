export const TESTNET_API_URL = "https://api.hyperliquid-testnet.xyz";
export const BUILDER_ADDRESS = "0x7c4E42B6cDDcEfa029D230137908aB178D52d324";

export const TAKER_FEE_RATE = 0.0003;
export const AUTO_CLOSE_THRESHOLD_PERCENT = -5;
export const DEFAULT_LEVERAGE = 1;

export const BUILDER_MAX_FEE_RATE = "0.1%";
export const BUILDER_FEE_MIN_APPROVAL = 100;

export const APPROVAL_WAIT_TIME_MS = 2000;

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "content-type, authorization, x-client-info, apikey, x-wallet-address",
  "Access-Control-Max-Age": "86400",
};

// For Funded Account
export const NUM_CHECKPOINTS = 99999;
export const CHECKPOINT_INTERVAL_HOURS = 24;
export const CHECKPOINT_PROFIT_TARGET = 8.0; // percent
