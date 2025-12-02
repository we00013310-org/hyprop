import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Inbox, X, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/MyButton";
import { Spinner } from "@/components/ui/spinner";
import {
  useOpenOrders,
  useCancelTestOrder,
  useCancelAllTestOrders,
} from "@/hooks/useTestOrders";
import { TestOrder } from "@/types";

interface OpenOrdersTableProps {
  testAccountId: string;
  currentPrice: number;
}

const OpenOrdersTable = ({
  testAccountId,
  currentPrice,
}: OpenOrdersTableProps) => {
  const [page, setPage] = useState(1);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );

  const { data: ordersData, isLoading, refetch } = useOpenOrders(testAccountId, page);

  const { mutate: cancelOrder, isPending: isCancelling } = useCancelTestOrder({
    testAccountId,
    onSuccess: () => {
      setCancellingOrderId(null);
      refetch();
    },
    onError: () => {
      setCancellingOrderId(null);
    },
  });

  const { mutate: cancelAllOrders, isPending: isCancellingAll } =
    useCancelAllTestOrders({
      testAccountId,
      onSuccess: () => {
        refetch();
      },
    });

  const handleCancelOrder = (orderId: string) => {
    setCancellingOrderId(orderId);
    cancelOrder(orderId);
  };

  const handleCancelAll = () => {
    cancelAllOrders(undefined);
  };

  const orders = ordersData?.data || [];
  const totalPages = ordersData?.totalPages || 1;
  const totalCount = ordersData?.count || 0;
  console.log('orders', orders)

  const columns: ColumnDef<TestOrder>[] = useMemo(
    () => [
      {
        accessorKey: "symbol",
        header: "Symbol",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{row.original.symbol}</span>
            <span
              className={clsx("text-xs px-1.5 py-0.5 rounded", {
                "bg-green-500/20 text-green-400": row.original.side === "buy",
                "bg-red-500/20 text-red-400": row.original.side === "sell",
              })}
            >
              {row.original.side.toUpperCase()}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "size",
        header: "Size",
        cell: ({ row }) => (
          <span
            className={clsx({
              "text-green-400": row.original.side === "buy",
              "text-red-400": row.original.side === "sell",
            })}
          >
            {row.original.size.toFixed(6)}
          </span>
        ),
      },
      {
        accessorKey: "price",
        header: "Limit Price",
        cell: ({ row }) => (
          <span className="text-white">
            ${row.original.price.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "orderValue",
        header: "Order Value",
        cell: ({ row }) => {
          const value = row.original.size * row.original.price;
          return <span className="text-white">${value.toFixed(2)}</span>;
        },
      },
      {
        accessorKey: "distance",
        header: "Distance",
        cell: ({ row }) => {
          const distance =
            ((row.original.price - currentPrice) / currentPrice) * 100;
          const isAbove = distance > 0;
          return (
            <span
              className={clsx({
                "text-green-400": isAbove,
                "text-red-400": !isAbove,
              })}
            >
              {isAbove ? "+" : ""}
              {distance.toFixed(2)}%
            </span>
          );
        },
      },
      {
        accessorKey: "reduce_only",
        header: "Reduce Only",
        cell: ({ row }) => (
          <span className="text-textBtn">
            {row.original.reduce_only ? "Yes" : "No"}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-textBtn text-xs">
            {new Date(row.original.created_at).toLocaleString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="flex justify-end">
            {orders.length > 0 && (
              <button
                onClick={handleCancelAll}
                disabled={isCancellingAll}
                className="text-red-400 hover:text-red-300 text-xs transition-colors disabled:opacity-50"
              >
                {isCancellingAll ? "Cancelling..." : "Cancel All"}
              </button>
            )}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-end">
            {cancellingOrderId === row.original.id || isCancelling ? (
              <Spinner className="h-4 w-4 text-red-400" />
            ) : (
              <button
                onClick={() => handleCancelOrder(row.original.id)}
                className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-400/10"
                title="Cancel order"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
      {
        accessorKey: "tp_price",
        header: "TP/SL",
        cell: ({ row }) => (
          <span className="text-textBtn text-xs">
            {row.original.tp_price ? `$${row.original.tp_price.toLocaleString()}` : "-"} / {row.original.sl_price ? `$${row.original.sl_price.toLocaleString()}` : "-"}
          </span>
        ),
      },
    ],
    [currentPrice, orders.length, cancellingOrderId, isCancelling, isCancellingAll]
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto fade-in">
      <Table className="mb-4">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-tradingBorder hover:bg-transparent"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-textBtn text-xs font-thin whitespace-nowrap"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="fade-in border-b border-tradingBorder hover:bg-tradingBgDark transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="text-xs whitespace-nowrap"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="fade-in border-b border-tradingBorder hover:bg-tradingBgDark transition-colors">
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-textBtn"
              >
                <span className="flex flex-col justify-center items-center gap-1 h-40">
                  <Inbox className="w-6 h-6" />
                  <span>No open orders</span>
                </span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-3 border-t border-tradingBorder">
          <div className="text-xs text-textBtn">
            Showing {orders.length} of {totalCount} orders
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-textBtn">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenOrdersTable;
