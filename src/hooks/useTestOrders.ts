import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { HyperliquidTrading } from "@/lib/hyperliquidTrading";
import { TestOrder, TestOrderInsert } from "@/types";

const PAGE_SIZE = 10;

export interface PaginatedOrders {
    data: TestOrder[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const useTestOrders = (
    testAccountId: string,
    page: number = 1,
    status?: string,
) => {
    return useQuery({
        queryKey: ["test-orders", testAccountId, page, status],
        queryFn: async (): Promise<PaginatedOrders> => {
            // Calculate offset for pagination
            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            // Build query
            let query = supabase
                .from("test_orders")
                .select("*", { count: "exact" })
                .eq("test_account_id", testAccountId)
                .order("created_at", { ascending: false })
                .range(from, to);

            // Filter by status if provided
            if (status) {
                query = query.eq("status", status);
            }

            const { data, error, count } = await query;

            if (error) {
                throw new Error(error.message);
            }

            return {
                data: data || [],
                count: count || 0,
                page,
                pageSize: PAGE_SIZE,
                totalPages: Math.ceil((count || 0) / PAGE_SIZE),
            };
        },
        enabled: !!testAccountId,
    });
};

export const useOpenOrders = (testAccountId: string, page: number = 1) => {
    return useTestOrders(testAccountId, page, "open");
};

export const useCreateTestOrder = ({
    testAccountId,
    onSuccess,
    onError,
}: {
    testAccountId: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: async (
            order: Omit<TestOrderInsert, "test_account_id" | "id">,
        ) => {
            const { data, error } = await supabase
                .from("test_orders")
                .insert({
                    ...order,
                    test_account_id: testAccountId,
                })
                .select()
                .single();

            if (error) {
                throw new Error(error.message);
            }

            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["test-orders", testAccountId],
            });
            toast.success(
                `Limit order placed: ${data.side.toUpperCase()} ${data.size} ${data.symbol} @ $${data.price}`,
            );
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to place limit order");
            onError?.(error);
        },
    });
};

export const useCancelTestOrder = ({
    testAccountId,
    onSuccess,
    onError,
}: {
    testAccountId: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: async (orderId: string) => {
            const { data, error } = await supabase
                .from("test_orders")
                .update({
                    status: "cancelled",
                    cancelled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", orderId)
                .eq("test_account_id", testAccountId)
                .eq("status", "open")
                .select()
                .single();

            if (error) {
                throw new Error(error.message);
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["test-orders", testAccountId],
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

export const useCancelAllTestOrders = ({
    testAccountId,
    onSuccess,
    onError,
}: {
    testAccountId: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: async (symbol?: string) => {
            let query = supabase
                .from("test_orders")
                .update({
                    status: "cancelled",
                    cancelled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("test_account_id", testAccountId)
                .eq("status", "open");

            if (symbol) {
                query = query.eq("symbol", symbol);
            }

            const { data, error } = await query.select();

            if (error) {
                throw new Error(error.message);
            }

            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["test-orders", testAccountId],
            });
            toast.success(`Cancelled ${data?.length || 0} order(s)`);
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to cancel orders");
            onError?.(error);
        },
    });
};

/**
 * Hook to manually fill a limit order by creating a simulated position.
 * This is useful for testing or when automatic matching is not desired.
 */
export const useFillTestOrder = ({
    testAccountId,
    onSuccess,
    onError,
}: {
    testAccountId: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();
    const toast = useToast();
    const { walletAddress } = useAuth();

    return useMutation({
        mutationFn: async (orderId: string) => {
            if (!walletAddress) {
                throw new Error("Wallet not connected");
            }

            // Get the order details
            const { data: order, error: fetchError } = await supabase
                .from("test_orders")
                .select("*")
                .eq("id", orderId)
                .eq("test_account_id", testAccountId)
                .eq("status", "open")
                .single();

            if (fetchError || !order) {
                throw new Error(fetchError?.message || "Order not found");
            }

            // Create position using the trading infrastructure
            const trading = new HyperliquidTrading(
                testAccountId,
                walletAddress,
                false,
            );

            const isBuy = order.side === "buy";
            const result = await trading.placeOrder(
                order.symbol,
                isBuy,
                order.size,
                order.price,
                "limit",
                order.reduce_only,
            );

            if (!result || result.status !== "ok") {
                throw new Error("Failed to create position");
            }

            // Mark the order as filled
            const { data: updatedOrder, error: updateError } = await supabase
                .from("test_orders")
                .update({
                    status: "filled",
                    filled_size: order.size,
                    filled_price: order.price,
                    filled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", orderId)
                .eq("status", "open")
                .select()
                .single();

            if (updateError) {
                throw new Error(updateError.message);
            }

            return updatedOrder;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["test-orders", testAccountId],
            });
            queryClient.invalidateQueries({
                queryKey: ["test-positions", testAccountId],
            });
            queryClient.invalidateQueries({
                queryKey: ["test-account", testAccountId],
            });
            toast.success(
                `Order filled: ${data.side.toUpperCase()} ${data.size} ${data.symbol} @ $${data.price}`,
            );
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to fill order");
            onError?.(error);
        },
    });
};
