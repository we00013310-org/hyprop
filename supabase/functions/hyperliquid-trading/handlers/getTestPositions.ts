import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { getRealOraclePrice, calculatePnL } from "../utils/priceOracle.ts";

export async function handleGetTestPositions(
  supabase: SupabaseClient,
  accountId: string
) {
  console.log("=== GETTING TEST POSITIONS ===");

  const { data: positions, error: positionsError } = await supabase
    .from("test_positions")
    .select("*")
    .eq("test_account_id", accountId)
    .order("created_at", { ascending: false });

  if (positionsError) {
    throw new Error(`Failed to fetch positions: ${positionsError.message}`);
  }

  const updatedPositions = await Promise.all(
    (positions || []).map(async (pos: any) => {
      const currentPrice = await getRealOraclePrice(pos.symbol, supabase);
      const size = parseFloat(pos.size.toString());
      const entryPrice = parseFloat(pos.avg_entry.toString());
      const upnl = calculatePnL(entryPrice, currentPrice, size);

      await supabase
        .from("test_positions")
        .update({
          upnl,
          last_update_ts: new Date().toISOString(),
        })
        .eq("id", pos.id);

      return {
        position: {
          coin: pos.symbol,
          szi: pos.size.toString(),
          entryPx: pos.avg_entry.toString(),
          marginUsed: pos.margin_used.toString(),
          unrealizedPnl: upnl.toString(),
          tpPrice: pos.tp_price,
          slPrice: pos.sl_price,
        },
      };
    })
  );

  return updatedPositions;
}
