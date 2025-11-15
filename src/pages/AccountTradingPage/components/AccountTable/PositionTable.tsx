import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil } from "lucide-react";
import clsx from "clsx";

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
  liqPrice: number;
  margin: number;
  marginType: "Isolated" | "Cross";
  funding: number;
  tpPrice?: string;
  slPrice?: string;
};

const PositionTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Sample data - replace with actual position data
  const data: Position[] = [
    {
      type: "long",
      coin: "BTC",
      leverage: "5x",
      size: "0.00001 BTC",
      positionValue: 0.96,
      entryPrice: 95722,
      markPrice: 95668,
      pnl: 0.0,
      roe: 0.3,
      liqPrice: 113460,
      margin: 0.19,
      marginType: "Isolated",
      funding: -0.0,
      tpPrice: "--",
      slPrice: "--",
    },
    {
      type: "short",
      coin: "BTC",
      leverage: "5x",
      size: "0.00001 BTC",
      positionValue: 0.96,
      entryPrice: 95722,
      markPrice: 95668,
      pnl: -0.1,
      roe: -0.3,
      liqPrice: 113460,
      margin: 0.19,
      marginType: "Isolated",
      funding: -0.0,
      tpPrice: "--",
      slPrice: "--",
    },
  ];

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
      header: () => {
        return (
          <button className="text-highlight transition-all cursor-pointer text-xs">
            Close All
          </button>
        );
      },
      cell: () => (
        <div className="flex gap-1">
          <button className="text-highlight transition-all cursor-pointer text-xs">
            Market
          </button>
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
    data,
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
                className="border-b border-tradingBorder hover:bg-tradingBgDark transition-colors"
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
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-tradingText"
              >
                No positions.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PositionTable;
