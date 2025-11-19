import { BUILDER_ADDRESS } from "../constants.ts";
import {
  getBuilderReferralState,
  getAccountValue,
} from "../services/hyperliquidApi.ts";

export async function handleGetBuilderFees(): Promise<any> {
  console.log("=== QUERYING BUILDER FEES ===");
  console.log("Builder address:", BUILDER_ADDRESS);

  const referralState = await getBuilderReferralState(BUILDER_ADDRESS);
  const builderAccountValue = await getAccountValue(BUILDER_ADDRESS);

  const result = {
    builderAddress: BUILDER_ADDRESS,
    accountValue: builderAccountValue,
    referralState: referralState,
    meetsMinimum: builderAccountValue >= 100,
  };

  console.log("Builder fees result:", JSON.stringify(result, null, 2));

  return result;
}
