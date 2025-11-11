import { useCallback, useState } from "react";

import { FundedAccount, TestAccount } from "../types";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export const useAccounts = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([]);
  const [fundedAccounts, setFundedAccounts] = useState<FundedAccount[]>([]);

  const loadAccounts = useCallback(async () => {
    if (!user) return;

    try {
      const [testResult, fundedResult] = await Promise.all([
        supabase
          .from("test_accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("funded_accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (testResult.data) setTestAccounts(testResult.data);
      if (fundedResult.data) setFundedAccounts(fundedResult.data);
    } catch (error) {
      console.error("Error loading accounts:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    loadAccounts,
    testAccounts,
    fundedAccounts,
  };
};
