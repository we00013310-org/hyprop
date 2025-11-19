import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getUserPositions, HyperliquidTrading } from "@/lib/hyperliquidTrading";

export const useAccount = (accountId: string, isFundedAccount = false) => {
  const { walletAddress } = useAuth();
  const mainKey = isFundedAccount ? "funded-account" : "test-account";

  return useQuery({
    queryKey: [mainKey, accountId],
    queryFn: async () => {
      const trading = new HyperliquidTrading(accountId, walletAddress!);
      if (isFundedAccount) {
        await trading.checkFundedStatus();
      } else {
        await trading.checkTestStatus();
      }

      const table = isFundedAccount ? "funded_accounts" : "test_accounts";
      const { data } = await supabase
        .from(table)
        .select("*")
        .eq("id", accountId as string)
        .single();

      return data;
    },
    enabled: !!walletAddress,
    refetchInterval: 10000,
  });
};

export const useCheckpoints = (accountId: string, isFundedAccount = false) => {
  const { walletAddress } = useAuth();
  const baseKey = isFundedAccount ? "funded" : "test";

  return useQuery({
    queryKey: [`${baseKey}-account-checkpoints`, accountId],
    queryFn: async () => {
      const { data } = await supabase
        .from(
          isFundedAccount
            ? "funded_account_checkpoints"
            : "test_account_checkpoints"
        )
        .select("*")
        .eq(isFundedAccount ? "account_id" : "test_account_id", accountId)
        .order("checkpoint_number", { ascending: true });

      return data;
    },
    enabled: !!walletAddress,
  });
};

export const usePositions = (accountId: string, isFundedAccount = false) => {
  const { walletAddress } = useAuth();
  return useQuery({
    queryKey: [
      isFundedAccount ? "funded-positions" : "test-positions",
      accountId,
    ],
    queryFn: async () => {
      const data = await getUserPositions(
        accountId,
        walletAddress!,
        isFundedAccount
      );

      return data.filter((pos) => {
        const size = parseFloat(pos.position?.szi || "0");
        return size !== 0;
      });
    },
    enabled: !!walletAddress,
  });
};
