import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { getFundedAccountInfo } from "../services/fundedAccount.ts";
import { LEVERAGE } from "./../constants.ts";

export async function handleGetFundedPositions(
  supabase: SupabaseClient,
  accountId: string
) {
  console.log("=== GETTING FUNDED POSITIONS ===");

  const { assetPositions } = await getFundedAccountInfo(supabase, accountId);

  const parsedPositions = assetPositions.map((o, index) => {
    const pos = o.position;
    return {
      position: {
        coin: pos.coin,
        entryPx: pos.entryPx,
        unrealizedPnl: pos.unrealizedPnl,
        marginUsed: 0,
        szi: pos.szi,
        marginType: "cross",
        liquidationPx: pos.liquidationPx,
        funding: pos.cumFunding.sinceOpen,
        id: index,
      },
    };
  });

  return parsedPositions;
}
