/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { HyperliquidTrading } from "@/lib/hyperliquidTrading";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const useCreateOrder = ({
  accountId,
  onSuccess,
  onError,
  isFundedAccount = false,
}: {
  accountId: string;
  onSuccess?: () => void;
  onError?: () => void;
  isFundedAccount?: boolean;
}) => {
  const { walletAddress } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({
      side,
      size,
      orderType,
      limitPrice,
      currentPrice,
      token = "BTC",
      reduceOnly = false,
    }: {
      side: "long" | "short";
      size: number;
      orderType: string; // "limit" | "market" | "pro"
      limitPrice?: number;
      currentPrice?: number;
      token?: string;
      reduceOnly?: boolean;
    }) => {
      const trading = new HyperliquidTrading(
        accountId,
        walletAddress as string,
        isFundedAccount
      );

      const isBuy = side === "long";
      const sizeNum = parseFloat(size.toString());
      const priceNum =
        orderType === "limit"
          ? parseFloat(
              limitPrice?.toString() || currentPrice?.toString() || "0"
            )
          : currentPrice;
      if (!priceNum) {
        throw new Error("Invalid price");
      }

      console.log("=== ORDER FORM SUBMISSION ===");
      console.log("Side:", side, "-> isBuy:", isBuy);
      console.log("Size input:", size, "-> sizeNum:", sizeNum);
      console.log("Order type:", orderType);
      console.log("Current price:", currentPrice);
      console.log("Limit price input:", limitPrice);
      console.log("Price to send:", orderType === "limit" ? priceNum : null);

      const result = await trading.placeOrder(
        token,
        isBuy,
        sizeNum,
        orderType === "limit" ? priceNum : null,
        orderType as "limit" | "market",
        reduceOnly
      );

      console.log("Order result:", result);

      if (result && result.status === "ok") {
        return true;
      } else {
        throw new Error(result?.response || result?.message || "Order failed");
      }
    },
    onSuccess: (_, input) => {
      const base = isFundedAccount ? "funded" : "test";
      queryClient.invalidateQueries({
        queryKey: [`${base}-positions`],
      });
      queryClient.invalidateQueries({
        queryKey: [`${base}-account`],
      });
      toast.success(`${input.token} Position created!`);
      onSuccess?.();
    },
    onError: (error) => {
      console.log("Error", error);
      toast.error(error.message || "Failed to place order");
      onError?.();
    },
  });
};

export const useClosePosition = ({
  accountId,
  isDisabled = false,
  isFundedAccount = false,
  onSuccess,
  onError,
}: {
  accountId: string;
  isDisabled?: boolean;
  isFundedAccount?: boolean;
  onSuccess?: () => void;
  onError?: () => void;
}) => {
  const { walletAddress } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [closingPositions, setClosingPositions] = useState<Set<string>>(
    new Set()
  );

  const mutation = useMutation({
    mutationFn: async ({ coin, size }: { coin: string; size: number }) => {
      if (isDisabled) {
        throw new Error("Cannot close positions on a disabled account");
      }

      const trading = new HyperliquidTrading(
        accountId,
        walletAddress as string,
        isFundedAccount
      );

      await trading.closePosition(coin, size);

      // Wait a moment for the order to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return { coin, size };
    },
    onMutate: ({ coin, size }) => {
      const positionKey = `${coin}-${size}`;
      setClosingPositions((prev) => new Set(prev).add(positionKey));
    },
    onSuccess: (data) => {
      const base = isFundedAccount ? "funded" : "test";
      queryClient.invalidateQueries({
        queryKey: [`${base}-positions`],
      });
      queryClient.invalidateQueries({
        queryKey: [`${base}-account`],
      });
      toast.success(`Successfully closed ${data.coin} position`);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Failed to close position:", error);
      toast.error(
        `Failed to close position: ${error.message || "Unknown error"}`
      );
      onError?.();
    },
    onSettled: (_, __, { coin, size }) => {
      const positionKey = `${coin}-${size}`;
      setClosingPositions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(positionKey);
        return newSet;
      });
    },
  });

  return {
    closePosition: mutation.mutate,
    closePositionAsync: mutation.mutateAsync,
    isClosing: (coin: string, size: number) =>
      closingPositions.has(`${coin}-${size}`),
    closingPositions,
    isPending: mutation.isPending,
  };
};

export const useCheckAndClosePosition = ({
  accountId,
  positionsLength,
  isDisabled = false,
  isFundedAccount = false,
}: {
  accountId: string;
  positionsLength: number;
  isDisabled?: boolean;
  isFundedAccount?: boolean;
}) => {
  const { walletAddress } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [
      isFundedAccount
        ? "check_close_funded_positions"
        : "check_close_positions",
      accountId,
    ],
    queryFn: async () => {
      try {
        const trading = new HyperliquidTrading(
          accountId,
          walletAddress!,
          isFundedAccount
        );
        await trading.updatePositionPnL();
        const base = isFundedAccount ? "funded" : "test";
        queryClient.invalidateQueries({ queryKey: [`${base}-positions`] });
        queryClient.invalidateQueries({ queryKey: [`${base}-account`] });
        console.log("Updated position PnL");

        return true;
      } catch (error) {
        console.error("Failed to update position PnL:", error);
      }
    },
    enabled: !!(positionsLength && accountId && walletAddress && !isDisabled),
    refetchInterval: 3000,
  });
};
