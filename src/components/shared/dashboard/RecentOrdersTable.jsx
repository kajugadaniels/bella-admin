import React from "react";
import { GlassCard, SectionTitle, currency, Tiny } from "./utils";
import { ShoppingBasket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const statusVariant = (s) => {
    switch ((s || "").toUpperCase()) {
        case "PAID":
        case "FULFILLED":
            return "default";
        case "PENDING":
        case "CONFIRMED":
            return "secondary";
        case "CANCELLED":
        case "REFUNDED":
            return "destructive";
        default:
            return "outline";
    }
};

export default function RecentOrdersTable({ orders = [], ccy = "RWF" }) {
    return (
        <GlassCard className="p-4">
            <SectionTitle icon={ShoppingBasket}>Recent orders (Today)</SectionTitle>
            <div className="mt-2 rounded-xl border border-neutral-200/70 dark:border-neutral-800 overflow-hidden">
                <div className="grid grid-cols-12 bg-neutral-50/70 dark:bg-neutral-900/40 px-3 py-2 text-xs font-medium">
                    <div className="col-span-4">Order</div>
                    <div className="col-span-3">Client</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-2 text-right">Total</div>
                </div>
                <Separator className="border-neutral-200 dark:border-neutral-800" />
                {orders.length === 0 ? (
                    <div className="px-3 py-6 text-sm text-neutral-500">No orders today.</div>
                ) : (
                    orders.map((o) => (
                        <div key={o.id} className="grid grid-cols-12 px-3 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                            <div className="col-span-4 min-w-0">
                                <div className="truncate font-medium">{o.code || `Order ${o.id.slice(0, 8)}`}</div>
                                <Tiny>{new Date(o.created_at).toLocaleTimeString()}</Tiny>
                            </div>
                            <div className="col-span-3 min-w-0">
                                <div className="truncate">{o?.client?.name || o?.contact_name || "—"}</div>
                                <Tiny className="truncate">{o?.contact_email || o?.client?.email || ""}</Tiny>
                            </div>
                            <div className="col-span-3">
                                <div className="flex gap-2">
                                    <Badge variant={statusVariant(o?.status)}>{o?.status || "—"}</Badge>
                                    <Badge variant={statusVariant(o?.payment_status)}>{o?.payment_status || "—"}</Badge>
                                </div>
                            </div>
                            <div className="col-span-2 text-right font-semibold">{currency(o?.grand_total, o?.currency || ccy)}</div>
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    );
}
