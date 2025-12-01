/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  getAccountInfo,
  getUserFundedOrders,
  getUserPositions,
  HyperliquidTrading,
} from "@/lib/hyperliquidTrading";
import { FundedOrder } from "@/types";

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

      const res = await getAccountInfo(
        accountId,
        walletAddress!,
        isFundedAccount
      );

      return res.data;
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

      return data.filter((pos: any) => {
        const size = parseFloat(pos.position?.szi || "0");
        return size !== 0;
      });
    },
    enabled: !!walletAddress,
  });
};

// for HL Orders
export const useFundedOrders = (accountId: string) => {
  const { walletAddress } = useAuth();

  return useQuery({
    queryKey: ["funded-orders", accountId],
    queryFn: async () => {
      const data = await getUserFundedOrders(accountId, walletAddress!);

      return (data as FundedOrder[]) || [];
    },
    enabled: !!walletAddress,
    refetchInterval: !!walletAddress && 30000,
  });
};
