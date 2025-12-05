import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Layers, PencilLine, Eye } from "lucide-react";

import ProductThumb from "./shared/ProductThumb";
import ExpiryBadge from "./shared/ExpiryBadge";

export default function ProductCard({
    item,
    publishBusy = {},
    onTogglePublish,
    onView,
    onEdit,
    onBatch,
}) {
    const p = item.product || {};
    const store = item.store;
    const q = item.quantities || {};
    const price = item.pricing || {};
    const dates = item.dates || {};

    const isPublished = !!p.published;
    const busy = publishBusy[p.id];

    return (
        <div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur-md">
            <div className="flex justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <ProductThumb src={p.image} alt={p.name} size={48} />

                    <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{p.name}</div>

                        <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                            <Badge variant="secondary" className="glass-badge">
                                {p.category || "—"}
                            </Badge>
                            <span>#{p.id}</span>
                        </div>

                        <div className="mt-0.5 text-xs text-neutral-500">
                            {store?.name || "Global"} · {dates.received_at?.slice(0, 10)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={isPublished}
                        disabled={busy}
                        onCheckedChange={(v) => onTogglePublish?.(p.id, !!v)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                </div>
            </div>

            <Separator className="my-3" />

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <MetricBox label="Remaining" value={q.remaining} />
                <MetricBox label="Received" value={q.received} />
                <MetricBox label="Discounted" value={price.unit_price} highlight />
                <MetricBox
                    label="Original"
                    value={p.discount_price}
                    strike
                    muted
                />
                <MetricBox label="Gross value" value={price.value_gross} />
            </div>

            <div className="mt-3 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                    Expiry: {dates.expiry_date?.slice(0, 10) || "—"}
                    <ExpiryBadge expiryDate={dates.expiry_date} />
                </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBatch?.(item.id)}
                    className="glass-button"
                >
                    <Layers className="mr-2 h-4 w-4" /> Batch
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit?.(p.id)}
                    className="glass-button"
                >
                    <PencilLine className="mr-2 h-4 w-4" /> Edit
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView?.(p.id)}
                    className="glass-button"
                >
                    <Eye className="mr-2 h-4 w-4" /> Details
                </Button>
            </div>
        </div>
    );
}

function MetricBox({ label, value, highlight = false, strike = false, muted = false }) {
    return (
        <div className="rounded-xl border border-black/5 bg-white/60 p-2">
            <div className="text-[11px] uppercase text-neutral-500">{label}</div>
            <div
                className={[
                    "font-semibold",
                    highlight ? "text-emerald-700" : "",
                    muted ? "text-neutral-600" : "",
                    strike ? "line-through decoration-red-500/70" : "",
                ].join(" ")}
            >
                {value ?? "—"}
            </div>
        </div>
    );
}
