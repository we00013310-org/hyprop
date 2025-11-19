import type { Wallet } from "npm:ethers@6";
import type { HttpTransport } from "npm:@nktkas/hyperliquid@0.25.7";
import { approveBuilderFee as approveBuilderFeeAPI } from "npm:@nktkas/hyperliquid@0.25.7/api/exchange";
import {
  BUILDER_ADDRESS,
  BUILDER_MAX_FEE_RATE,
  BUILDER_FEE_MIN_APPROVAL,
  APPROVAL_WAIT_TIME_MS,
} from "../constants.ts";
import { getMaxBuilderFee } from "../services/hyperliquidApi.ts";

export async function handleApproveBuilderFee(
  wallet: Wallet,
  transport: HttpTransport,
  derivedAddress: string
): Promise<any> {
  console.log("=== APPROVING BUILDER FEE ===");
  console.log("Wallet address:", derivedAddress);
  console.log("Builder address:", BUILDER_ADDRESS);
  console.log("Max fee rate:", BUILDER_MAX_FEE_RATE);

  try {
    const currentApproval = await getMaxBuilderFee(
      derivedAddress,
      BUILDER_ADDRESS
    );
    console.log(
      "Current approval BEFORE:",
      currentApproval,
      "(tenths of basis points)"
    );

    console.log("Calling approveBuilderFeeAPI...");
    const result = await approveBuilderFeeAPI(
      { transport, wallet },
      {
        maxFeeRate: BUILDER_MAX_FEE_RATE,
        builder: BUILDER_ADDRESS,
      }
    );

    console.log("=== BUILDER FEE APPROVAL API RESPONSE ===");
    console.log("Full result:", JSON.stringify(result, null, 2));
    console.log("Result type:", typeof result);
    console.log(
      "Result keys:",
      result ? Object.keys(result) : "null/undefined"
    );

    if (result?.response?.type === "error") {
      console.error("Approval returned error:", result.response.payload);
      throw new Error(`Approval failed: ${result.response.payload}`);
    }

    console.log("Waiting for blockchain to process...");
    await new Promise((resolve) => setTimeout(resolve, APPROVAL_WAIT_TIME_MS));

    const newApproval = await getMaxBuilderFee(
      derivedAddress,
      BUILDER_ADDRESS
    );
    console.log(
      "New approval AFTER:",
      newApproval,
      "(tenths of basis points)"
    );

    if (newApproval === 0 || newApproval < BUILDER_FEE_MIN_APPROVAL) {
      console.error(
        `WARNING: Approval did not persist! Still less than ${BUILDER_FEE_MIN_APPROVAL} (${BUILDER_MAX_FEE_RATE})`
      );
      throw new Error("Builder fee approval did not persist. Try again.");
    }

    console.log("=== BUILDER FEE APPROVAL SUCCESS ===");
    console.log(
      `Approved ${newApproval} tenths of basis points (${
        newApproval / 10000
      }%)`
    );

    return result;
  } catch (error: any) {
    console.error("=== BUILDER FEE APPROVAL ERROR ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    throw new Error(
      `Builder fee approval failed: ${error.message || String(error)}`
    );
  }
}
