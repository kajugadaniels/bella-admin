import React from "react";
import { GlassCard, SectionTitle, currency, Tiny } from "./utils";
import { Trophy } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function TopProductsTable({ items = [], ccy = "RWF" }) {
    return (
        <GlassCard className="p-4">
            <SectionTitle icon={Trophy}>Top products (by gross value today)</SectionTitle>
            <div className="mt-2 rounded-xl border border-neutral-200/70 dark:border-neutral-800 overflow-hidden">
                <div className="grid grid-cols-12 bg-neutral-50/70 dark:bg-neutral-900/40 px-3 py-2 text-xs font-medium">
                    <div className="col-span-6">Product</div>
                    <div className="col-span-2 text-right">Qty out</div>
                    <div className="col-span-2 text-right">Unit price</div>
                    <div className="col-span-2 text-right">Gross</div>
                </div>
                <Separator className="border-neutral-200 dark:border-neutral-800" />
                {items.length === 0 ? (
                    <div className="px-3 py-6 text-sm text-neutral-500">No sales today.</div>
                ) : (
                    items.map((it) => (
                        <div key={it.id} className="grid grid-cols-12 px-3 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                            <div className="col-span-6 min-w-0">
                                <div className="truncate font-medium">{it.name}</div>
                                <Tiny>{it.category || "—"}</Tiny>
                            </div>
                            <div className="col-span-2 text-right">{it.qtyOut}</div>
                            <div className="col-span-2 text-right">{currency(it.unitPrice, ccy)}</div>
                            <div className="col-span-2 text-right font-semibold">{currency(it.gross, ccy)}</div>
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    );
}
