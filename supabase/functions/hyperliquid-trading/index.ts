/* eslint-disable @typescript-eslint/no-explicit-any */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Wallet } from "npm:ethers@6";
import { HttpTransport } from "npm:@nktkas/hyperliquid@0.25.7";

import { CORS_HEADERS } from "./constants.ts";
import type { Action, TestAccount } from "./types.ts";
import {
  validateWalletAddress,
  validatePrivateKey,
  validateAccountForTrading,
} from "./utils/validation.ts";
import { handlePlaceOrder } from "./handlers/placeOrder.ts";
import {
  handleCancelOrder,
  handleCancelAllOrders,
} from "./handlers/cancelOrder.ts";
import { handleGetTestPositions } from "./handlers/getTestPositions.ts";
import { handleGetFundedPositions } from "./handlers/getFundedPositions.ts";
import { handleUpdatePositionPnL } from "./handlers/updatePositionPnL.ts";
import { handleCheckTestStatus } from "./handlers/checkTestStatus.ts";
import { handleCheckFundedStatus } from "./handlers/checkFundedStatus.ts";
import { handleFailFundedAccount } from "./handlers/failFundedAccount.ts";
import { getFundedAccountInfo } from "./services/fundedAccount.ts";

interface RequestContext {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  account: TestAccount;
  wallet: Wallet | null;
  transport: HttpTransport | null;
  derivedAddress: string | null;
}

async function authenticate(
  req: Request
): Promise<{ supabase: ReturnType<typeof createClient>; userId: string }> {
  const walletAddress = req.headers.get("x-wallet-address");
  validateWalletAddress(walletAddress);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", walletAddress!.toLowerCase())
    .maybeSingle();

  if (!user) {
    throw new Error("User not found");
  }

  return { supabase, userId: user.id };
}

async function loadAccount(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  userId: string
) {
  const [res1, res2] = await Promise.all([
    supabase
      .from("test_accounts")
      .select("*")
      .eq("id", accountId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("funded_accounts")
      .select("*")
      .eq("id", accountId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (res1.accountError && res2.accountError) {
    throw new Error("Account error");
  }

  if (!res1.data && !res2.data) {
    throw new Error("Account not found or unauthorized");
  }

  if (res2.data) {
    const data = await getFundedAccountInfo(supabase, res2.data.id);
    return {
      ...data,
      wallet: undefined,
      assetPositions: undefined,
    };
  }

  return res1.data || res2.data;
}

function initializeWallet(account: TestAccount): {
  wallet: Wallet | null;
  transport: HttpTransport | null;
  derivedAddress: string | null;
} {
  if (!account.hl_key) {
    console.log("No hl_key configured - using Phase 1 simulated trading");
    return { wallet: null, transport: null, derivedAddress: null };
  }

  const trimmedKey = account.hl_key.trim();
  validatePrivateKey(trimmedKey);

  const wallet = new Wallet(trimmedKey);
  const derivedAddress = wallet.address;
  const transport = new HttpTransport({ isTestnet: true });

  console.log("Wallet address:", derivedAddress);

  return { wallet, transport, derivedAddress };
}

async function routeAction(
  action: Action,
  accountId: string,
  context: RequestContext
): Promise<any> {
  const { supabase, account } = context;

  switch (action.type) {
    case "getTestAccount":
    case "getFundedAccount":
      return account;

    case "placeOrder":
      validateAccountForTrading(account);
      return await handlePlaceOrder(supabase, action, accountId);

    case "placeFundedOrder":
      validateAccountForTrading(account);
      return await handlePlaceOrder(supabase, action, accountId, true);

    case "cancelOrder":
      return await handleCancelOrder();

    case "cancelAllOrders":
      return await handleCancelAllOrders();

    case "getTestPositions":
      return await handleGetTestPositions(supabase, accountId);

    case "getFundedPositions":
      return await handleGetFundedPositions(supabase, accountId);

    case "updatePositionPnL":
      return await handleUpdatePositionPnL(supabase, accountId);

    case "updateFundedPositionPnL":
      return await handleCheckFundedStatus(supabase, accountId);

    case "checkTestStatus":
      return await handleCheckTestStatus(supabase, accountId);

    case "checkFundedStatus":
      return await handleCheckFundedStatus(supabase, accountId);

    case "failFundedAccount":
      return await handleFailFundedAccount(supabase, accountId);

    default:
      throw new Error("Invalid action type");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  try {
    const { supabase, userId } = await authenticate(req);
    const { action, accountId } = await req.json();

    console.log("=== NEW REQUEST ===");
    console.log("Action:", JSON.stringify(action));
    console.log("Account ID:", accountId);
    console.log("User ID:", userId);

    const account = await loadAccount(supabase, accountId, userId);
    const { wallet, transport, derivedAddress } = initializeWallet(account);

    const context: RequestContext = {
      supabase,
      userId,
      account,
      wallet,
      transport,
      derivedAddress,
    };

    const result = await routeAction(action, accountId, context);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        walletAddress: derivedAddress || null,
      }),
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("=== HANDLER ERROR ===");
    console.error("Error:", error);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    const errorMessage = error.message || String(error);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 400,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
