/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Inbox, Pencil } from "lucide-react";
import clsx from "clsx";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePositions } from "@/hooks/account";
import { useCheckAndClosePosition, useClosePosition } from "@/hooks/order";
import { Spinner } from "@/components/ui/spinner";

// Position type matching Hyperliquid's position structure
export type Position = {
  type: "long" | "short";
  coin: string;
  leverage: string;
  size: string;
  positionValue: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  roe: number;
  liqPrice: number | string;
  margin: number;
  marginType: "Isolated" | "Cross";
  funding: number;
  tpPrice?: string;
  slPrice?: string;
};

interface PositionTableProps {
  accountId: string;
  currentPrice: number;
  isDisabled?: boolean;
  isFundedAccount?: boolean;
}

const PositionTable = ({
  accountId,
  currentPrice,
  isDisabled = false,
  isFundedAccount = false,
}: PositionTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { closePosition, isClosing } = useClosePosition({
    accountId,
    isDisabled,
    isFundedAccount,
  });

  const { data } = usePositions(accountId, isFundedAccount);
  const parsedData: Position[] = useMemo(() => {
    return (
      data?.map((pos: any) => {
        const size = parseFloat(pos.position.szi);
        const entryPx = parseFloat(pos.position.entryPx ?? "0");
        const marginUsed = parseFloat(pos.position.marginUsed ?? "0");
        const unrealizedPnl = parseFloat(pos.position.unrealizedPnl ?? "0");
        const isLong = size > 0;
        const coin = pos.position.coin;

        return {
          type: isLong ? "long" : "short",
          coin: coin,
          leverage: pos.position.leverage ?? "1X",
          size: `${Math.abs(size).toFixed(5)}`,
          positionValue: +(Math.abs(size) * entryPx).toFixed(2),
          entryPrice: entryPx,
          markPrice: currentPrice,
          pnl: unrealizedPnl,
          roe: marginUsed > 0 ? (unrealizedPnl / marginUsed) * 100 : 0,
          liqPrice: "--",
          margin: marginUsed,
          marginType: pos.position.marginType ?? "Isolated",
          funding: parseFloat(pos.position.funding ?? "0"),
          tpPrice: pos.position.tpPx ?? "--",
          slPrice: pos.position.slPx ?? "--",
        };
      }) || []
    );
  }, [data]);

  useCheckAndClosePosition({
    accountId,
    positionsLength: parsedData.length,
    isDisabled,
    isFundedAccount,
  });

  const columns: ColumnDef<Position>[] = [
    {
      accessorKey: "coin",
      header: "Coin",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span
            className={clsx("font-medium", {
              "text-red-200": row.original.type === "short",
              "text-green-200": row.original.type === "long",
            })}
          >
            {row.original.coin}
          </span>
          <span
            className={clsx("font-medium", {
              "text-red-400": row.original.type === "short",
              "text-green-400": row.original.type === "long",
            })}
          >
            {row.original.leverage}
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
            "text-red-400": row.original.type === "short",
            "text-green-400": row.original.type === "long",
          })}
        >
          {row.original.size}
        </span>
      ),
    },
    {
      accessorKey: "positionValue",
      header: "Position Value",
      //   header: ({ column }) => {
      //     return (
      //       <button
      //         className="flex items-center gap-1 hover:text-white transition-all cursor-pointer"
      //         // onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      //       >
      //         Position Value
      //         <ArrowUpDown className="h-3 w-3" />
      //       </button>
      //     );
      //   },
      cell: ({ row }) => (
        <span className="text-white">{row.original.positionValue} USDC</span>
      ),
    },
    {
      accessorKey: "entryPrice",
      header: "Entry Price",
      cell: ({ row }) => (
        <span className="text-white">
          {row.original.entryPrice.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "markPrice",
      header: "Mark Price",
      cell: ({ row }) => (
        <span className="text-white">
          {row.original.markPrice.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "pnl",
      header: "PNL (ROE %)",
      cell: ({ row }) => {
        const pnl = Math.abs(row.original.pnl);
        const roe = row.original.roe;
        const isPositive = row.original.pnl >= 0;

        return (
          <div className="flex items-center gap-1">
            <span className={isPositive ? "text-green-400" : "text-red-400"}>
              {isPositive ? "+" : "-"}${pnl.toFixed(2)} ({isPositive ? "+" : ""}
              {roe.toFixed(1)}%)
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "liqPrice",
      header: "Liq. Price",
      cell: ({ row }) => (
        <span className="text-white">
          {row.original.liqPrice.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "margin",
      header: "Margin",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-white">${row.original.margin.toFixed(2)}</span>
          <span className="text-xs text-tradingText">
            ({row.original.marginType})
          </span>
          <button className="text-tradingText hover:text-white transition-colors">
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      ),
    },
    {
      accessorKey: "funding",
      header: "Funding",
      cell: ({ row }) => {
        const funding = row.original.funding;
        const isPositive = funding >= 0;
        return (
          <span className={isPositive ? "text-green-400" : "text-red-400"}>
            {isPositive ? "" : "-"}${Math.abs(funding).toFixed(2)}
          </span>
        );
      },
    },
    {
      id: "closeAll",
      header: "Close Action",
      // header: () => {
      //   return (
      //     <button className="text-highlight transition-all cursor-pointer text-xs">
      //       Close Action
      //     </button>
      //   );
      // },
      cell: ({ row }) => (
        <div className="flex gap-1">
          {isClosing(row.original.coin, +row.original.size) ? (
            <Spinner className="text-highlight" />
          ) : (
            <button
              onClick={() =>
                closePosition({
                  coin: row.original.coin,
                  size: +row.original.size,
                })
              }
              className="text-highlight hover:underline transition-all cursor-pointer text-xs"
            >
              Market
            </button>
          )}
        </div>
      ),
    },
    {
      id: "tpsl",
      header: "TP/SL",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-tradingText text-sm">
            {row.original.tpPrice}
          </span>
          <span className="text-tradingText text-sm">/</span>
          <span className="text-tradingText text-sm">
            {row.original.slPrice}
          </span>
          <button className="text-tradingText hover:text-white transition-colors">
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: parsedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

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
                  <span>No positions</span>
                </span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PositionTable;
