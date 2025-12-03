import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { HyperliquidTrading } from "@/lib/hyperliquidTrading";

export interface CreateFundedOrderParams {
    symbol: string;
    side: "buy" | "sell";
    size: number;
    price: number;
    order_type: "limit" | "market";
    reduce_only?: boolean;
    tp_price?: number;
    sl_price?: number;
}

/**
 * Hook to create a limit order for funded accounts.
 * This uses the placeFundedOrder API to place real orders on Hyperliquid.
 */
export const useCreateFundedOrder = ({
    fundedAccountId,
    onSuccess,
    onError,
}: {
    fundedAccountId: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();
    const toast = useToast();
    const { walletAddress } = useAuth();

    return useMutation({
        mutationFn: async (order: CreateFundedOrderParams) => {
            if (!walletAddress) {
                throw new Error("Wallet not connected");
            }

            const trading = new HyperliquidTrading(
                fundedAccountId,
                walletAddress,
                true, // isFundedAccount = true
            );

            const isBuy = order.side === "buy";

            // Place the order using the existing infrastructure
            const result = await trading.placeOrder(
                order.symbol,
                isBuy,
                order.size,
                order.price,
                order.order_type,
                order.reduce_only || false,
                order.tp_price,
                order.sl_price,
            );

            if (!result || result.status !== "ok") {
                throw new Error(
                    result?.response?.message || result?.message ||
                        "Failed to place order",
                );
            }

            return {
                symbol: order.symbol,
                side: order.side,
                size: order.size,
                price: order.price,
            };
        },
        onSuccess: (data) => {
            // Invalidate funded orders query to refresh the list
            queryClient.invalidateQueries({
                queryKey: ["funded-orders", fundedAccountId],
            });
            // Also invalidate positions in case of immediate fill
            queryClient.invalidateQueries({
                queryKey: ["funded-positions", fundedAccountId],
            });
            queryClient.invalidateQueries({
                queryKey: ["funded-account", fundedAccountId],
            });

            toast.success(
                `Limit order placed: ${data.side.toUpperCase()} ${
                    data.size.toFixed(6)
                } ${data.symbol} @ $${data.price.toLocaleString()}`,
            );
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to place limit order");
            onError?.(error);
        },
    });
};

/**
 * Hook to cancel a single funded order.
 * This wraps the existing useCancelFundedOrder from order.ts with better typing.
 */
export const useCancelFundedLimitOrder = ({
    fundedAccountId,
    onSuccess,
    onError,
}: {
    fundedAccountId: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();
    const toast = useToast();
    const { walletAddress } = useAuth();

    return useMutation({
        mutationFn: async ({ coin, oid }: { coin: string; oid: number }) => {
            if (!walletAddress) {
                throw new Error("Wallet not connected");
            }

            const trading = new HyperliquidTrading(
                fundedAccountId,
                walletAddress,
                true,
            );

            await trading.cancelOrder(coin, oid);
            return { coin, oid };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["funded-orders", fundedAccountId],
            });
            toast.success("Order cancelled successfully");
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to cancel order");
            onError?.(error);
        },
    });
};

/**
 * Hook to cancel all funded orders.
 */
export const useCancelAllFundedLimitOrders = ({
    fundedAccountId,
    onSuccess,
    onError,
}: {
    fundedAccountId: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();
    const toast = useToast();
    const { walletAddress } = useAuth();

    return useMutation({
        mutationFn: async () => {
            if (!walletAddress) {
                throw new Error("Wallet not connected");
            }

            const trading = new HyperliquidTrading(
                fundedAccountId,
                walletAddress,
                true,
            );

            await trading.cancelAllOrders();
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["funded-orders", fundedAccountId],
            });
            toast.success("All orders cancelled successfully");
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to cancel orders");
            onError?.(error);
        },
    });
};
