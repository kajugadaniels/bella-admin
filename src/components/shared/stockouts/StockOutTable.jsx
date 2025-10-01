import React from "react";
import { Eye } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function currency(amount, ccy) {
  if (amount === null || amount === undefined) return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return `${amount}${ccy ? ` ${ccy}` : ""}`;
  return `${n.toLocaleString()}${ccy ? ` ${ccy}` : ""}`;
}

const reasonVariant = (s) => {
  switch ((s || "").toUpperCase()) {
    case "SALE":
      return "default";
    case "DAMAGE":
      return "destructive";
    case "ADJUSTMENT":
    case "TRANSFER_OUT":
      return "secondary";
    default:
      return "outline";
  }
};

const Card = ({ r, onView }) => {
  const p = r?.product || {};
  const title = p?.name || "Product";
  return (
    <div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
      <div className="flex items-start gap-3">
        {p?.image ? (
          <img
            src={p.image}
            alt={title}
            className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
          />
        ) : (
          <div
            className="h-8 w-8 shrink-0 rounded-lg grid place-items-center text-[12px] font-semibold text-white ring-1 ring-black/5 dark:ring-white/10"
            style={{
              background:
                "linear-gradient(135deg, var(--primary-color), #059669)",
            }}
          >
            {String(title).slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold">{title}</div>
            <Badge variant={reasonVariant(r?.reason)} className="glass-badge">
              {r?.reason || "—"}
            </Badge>
          </div>
          <div className="truncate text-xs text-neutral-500">{r?.id}</div>

          <div className="mt-2 grid gap-1 text-sm">
            <div>Qty {r?.quantity ?? "—"}</div>
            <div className="text-neutral-500">
              Value {currency(r?.value_total, r?.currency)}
            </div>
          </div>

          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView?.(r)}
              className="glass-button px-6 py-4 rounded-4xl"
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StockOutTable({ rows = [], loading = false, onView }) {
  const empty = !loading && (!rows || rows.length === 0);

  return (
    <>
      {/* Mobile: cards */}
      <div className="md:hidden">
        {loading && (
          <div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50">
            Loading stockouts…
          </div>
        )}
        {empty && (
          <div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50">
            No stockouts found.
          </div>
        )}
        {!loading &&
          rows?.map((r) => (
            <div key={r.id} className="mb-3">
              <Card r={r} onView={onView} />
            </div>
          ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-black/5 dark:ring-white/10">
        <Table className="table-glassy">
          <TableHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur dark:bg-neutral-900/50">
            <TableRow className="border-0">
              <TableHead className="min-w-[280px]">Product</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Reason</TableHead>
              <TableHead className="text-right">Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow className="border-0">
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-neutral-500"
                >
                  Loading stockouts…
                </TableCell>
              </TableRow>
            )}
            {empty && (
              <TableRow className="border-0">
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-neutral-500"
                >
                  No stockouts found.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              rows?.map((r) => {
                const p = r?.product || {};
                const title = p?.name || "Product";
                return (
                  <TableRow
                    key={r.id}
                    className="row-soft last:border-0 hover:bg-black/[0.025] dark:hover:bg-white/5 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {p?.image ? (
                          <img
                            src={p.image}
                            alt={title}
                            className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
                          />
                        ) : (
                          <div
                            className="h-7 w-7 shrink-0 rounded-md grid place-items-center text-[12px] font-semibold text-white bg-gradient-to-br from-[var(--primary-color)] to-emerald-600 ring-1 ring-black/5 dark:ring-white/10"
                            aria-hidden
                            title={title}
                          >
                            {String(title).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {title}
                          </div>
                          <div className="truncate text-xs text-neutral-500">
                            {r.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">{r?.quantity ?? "—"}</div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="text-sm">
                        {currency(r?.value_total, r?.currency)}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Badge
                        variant={reasonVariant(r?.reason)}
                        className="glass-badge"
                      >
                        {r?.reason || "—"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="text-sm">
                        {r?.created_at
                          ? new Date(r.created_at).toISOString().slice(0, 10)
                          : "—"}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {r?.created_at
                          ? new Date(r.created_at).toISOString().slice(11, 16)
                          : ""}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 cursor-pointer"
                        onClick={() => onView?.(r)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
