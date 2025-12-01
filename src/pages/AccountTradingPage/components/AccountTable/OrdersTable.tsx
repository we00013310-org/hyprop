import { useCallback, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Inbox, X } from "lucide-react";
import clsx from "clsx";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/Spinner";
import { FundedOrder } from "@/types";
import { useFundedOrders } from "@/hooks/account";
import { useCancelAllFundedOrders, useCancelFundedOrder } from "@/hooks/order";

interface FundedOrdersTableProps {
  accountId: string;
  currentPrice: number;
}

const FundedOrdersTable = ({
  accountId,
  currentPrice,
}: FundedOrdersTableProps) => {
  const { data: orders, isLoading } = useFundedOrders(accountId);

  const { mutate: cancelOrder, isPending: isCancelling } = useCancelFundedOrder(
    {
      accountId,
    }
  );

  const { mutate: cancelAllOrders, isPending: isCancellingAll } =
    useCancelAllFundedOrders({
      accountId,
    });

  const handleCancelOrder = useCallback(
    (coin: string, oid: number) => {
      cancelOrder({ coin, oid });
    },
    [cancelOrder]
  );

  const handleCancelAllOrders = useCallback(() => {
    cancelAllOrders();
  }, [cancelAllOrders]);

  const columns: ColumnDef<FundedOrder>[] = useMemo(
    () => [
      {
        accessorKey: "symbol",
        header: "Symbol",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{row.original.coin}</span>
            <span
              className={clsx("text-xs px-1.5 py-0.5 rounded", {
                "bg-green-500/20 text-green-400": row.original.side === "B",
                "bg-red-500/20 text-red-400": row.original.side !== "B",
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
              "text-green-400": row.original.side === "B",
              "text-red-400": row.original.side !== "B",
            })}
          >
            {row.original.sz.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "price",
        header: "Limit Price",
        cell: ({ row }) => (
          <span className="text-white">
            ${(+row.original.limitPx).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "orderValue",
        header: "Order Value",
        cell: ({ row }) => {
          const value = +row.original.sz * +row.original.limitPx;
          return (
            <span className="text-white">
              ${(+value.toFixed(2)).toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: "currentPrice",
        header: "Cur. Price",
        cell: () => {
          return (
            <span className="text-white">{currentPrice.toLocaleString()}</span>
          );
        },
      },
      {
        accessorKey: "reduce_only",
        header: "Reduce Only",
        cell: () => <span className="text-textBtn">-</span>,
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-textBtn text-xs">
            {new Date(row.original.timestamp).toLocaleString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="flex justify-end">
            {!!orders?.length && (
              <button
                onClick={handleCancelAllOrders}
                disabled={isCancellingAll}
                className="text-red-400 hover:text-red-300 text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isCancellingAll ? "Cancelling..." : "Cancel All"}
              </button>
            )}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-end">
            {isCancelling || isCancellingAll ? (
              <Spinner className="h-4 w-4 text-red-400" />
            ) : (
              <button
                className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-400/10 cursor-pointer"
                onClick={() =>
                  handleCancelOrder(row.original.coin, row.original.oid)
                }
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [
      currentPrice,
      handleCancelAllOrders,
      handleCancelOrder,
      isCancelling,
      isCancellingAll,
      orders?.length,
    ]
  );

  const table = useReactTable({
    data: orders ?? [],
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
    </div>
  );
};

export default FundedOrdersTable;
