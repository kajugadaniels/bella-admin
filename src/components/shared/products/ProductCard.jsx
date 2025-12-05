import React from "react";
import { Layers, PencilLine, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import ProductThumb from "./ProductThumb";
import ExpiryBadge from "./ExpiryBadge";

/**
 * ProductCard - small mobile card used in ProductsList for small screens
 *
 * Props:
 *   - row: product stock-in row (same shape used in ProductsList)
 *   - onView(pid), onEdit(pid), onBatch(sid), onTogglePublish(pid, bool)
 *   - publishBusy: object map of productId -> busy boolean
 */
export default function ProductCard({ row, onView, onEdit, onBatch, onTogglePublish, publishBusy }) {
    const s = row || {};
    const p = s.product || {};
    const store = s.store;
    const q = s.quantities || {};
    const val = s.pricing || {};
    const d = s.dates || {};

    const isPublished = !!p.published;
    const busy = !!publishBusy?.[p.id];

    const fmtNum = (n) => {
        if (n === null || n === undefined) return "—";
        const num = Number(n);
        if (Number.isNaN(num)) return String(n);
        return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(num);
    };

    const dateOnly = (iso) => {
        if (!iso) return "—";
        try { return new Date(iso).toISOString().slice(0, 10); } catch { return String(iso); }
    };

    return (
        <div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                    <ProductThumb src={p.image || null} alt={p.name} size={44} />
                    <div className="min-w-0">
                        <div className="truncate font-medium">{p.name || "—"}</div>
                        {p.discount_rate > 0 && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                                -{p.discount_rate}% 
                            </Badge>
                        )}
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            <Badge variant="secondary" className="glass-badge">{p.category || "UNCAT"}</Badge>
                            {store?.name ? <span className="truncate">· {store.name}</span> : <span className="truncate">· Global</span>}
                            <span className="truncate">· {dateOnly(d.received_at)}</span>
                            {d.expiry_date && <span className="truncate">· Exp {dateOnly(d.expiry_date)}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={isPublished}
                        disabled={busy}
                        onCheckedChange={(v) => onTogglePublish?.(p.id, !!v)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        aria-label={`Publish ${p.name || "product"}`}
                    />
                    <span className="text-xs text-neutral-600">{isPublished ? "Published" : "Unpublished"}</span>
                </div>
            </div>

            <Separator className="my-3" />

            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                    <div className="text-xs uppercase text-neutral-500">Remaining</div>
                    <div className="font-semibold">{fmtNum(q.remaining)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                    <div className="text-xs uppercase text-neutral-500">Received</div>
                    <div className="font-semibold">{fmtNum(q.received)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                    <div className="text-xs uppercase text-neutral-500">Discounted</div>
                    <div className="font-semibold text-emerald-700">{fmtNum(val.unit_price)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                    <div className="text-xs uppercase text-neutral-500">Original</div>
                    <div className="font-semibold text-neutral-600 line-through decoration-red-500/70">
                        {fmtNum(p.discount_price)}
                    </div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2 col-span-2">
                    <div className="text-xs uppercase text-neutral-500">Discount</div>
                    <div className="font-medium text-amber-600">{fmtNum(p.discount_rate)}%</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                    <div className="text-xs uppercase text-neutral-500">Gross value</div>
                    <div className="font-semibold">{fmtNum(val.value_gross)}</div>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" className="glass-button" onClick={() => onBatch?.(s.id)}>
                    <Layers className="mr-2 h-4 w-4" />
                    Batch
                </Button>
                <Button variant="outline" size="sm" className="glass-button" onClick={() => onEdit?.(p.id)}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Edit
                </Button>
                <Button variant="outline" size="sm" className="glass-button" onClick={() => onView?.(p.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Details
                </Button>
            </div>
        </div>
    );
}
