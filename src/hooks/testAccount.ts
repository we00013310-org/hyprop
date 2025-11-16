import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getUserPositions } from "@/lib/hyperliquidTrading";

export const useTestAccount = (accountId: string) => {
  const { walletAddress } = useAuth();

  return useQuery({
    queryKey: ["test-account", accountId],
    queryFn: async () => {
      const { data } = await supabase
        .from("test_accounts")
        .select("*")
        .eq("id", accountId as string)
        .single();

      return data;
    },
    enabled: !!walletAddress,
    refetchInterval: 10000,
  });
};

export const useCheckpoints = (accountId: string) => {
  const { walletAddress } = useAuth();

  return useQuery({
    queryKey: ["test-account-checkpoints", accountId],
    queryFn: async () => {
      const { data } = await supabase
        .from("test_account_checkpoints")
        .select("*")
        .eq("test_account_id", accountId)
        .order("checkpoint_number", { ascending: true });

      return data;
    },
    enabled: !!walletAddress,
  });
};

export const usePositions = (accountId: string) => {
  const { walletAddress } = useAuth();
  return useQuery({
    queryKey: ["test-positions", accountId],
    queryFn: async () => {
      const data = await getUserPositions(accountId, walletAddress!);

      return data.filter((pos) => {
        const size = parseFloat(pos.position?.szi || "0");
        return size !== 0;
      });
    },
    enabled: !!walletAddress,
  });
};
