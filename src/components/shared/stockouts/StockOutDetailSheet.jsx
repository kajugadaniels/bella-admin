import React, { useCallback, useEffect, useState } from "react";
import { superadmin } from "@/api";
import { toast } from "sonner";
import {
    ClipboardCopy,
    ExternalLink,
    ShoppingBasket,
    BadgeCheck,
    UserCircle2,
    Warehouse,
    ReceiptText,
    Truck,
    Boxes,
} from "lucide-react";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function currency(amount, ccy) {
    if (amount === null || amount === undefined) return "—";
    const n = Number(amount);
    if (Number.isNaN(n)) return `${amount}${ccy ? ` ${ccy}` : ""}`;
    return `${n.toLocaleString()}${ccy ? ` ${ccy}` : ""}`;
}

const GlassCard = ({ className = "", children }) => (
    <div
        className={[
            "rounded-2xl border p-3",
            "border-neutral-200/80 bg-white/70 backdrop-blur-md",
            className,
        ].join(" ")}
    >
        {children}
    </div>
);

const Row = ({ label, value, href }) => {
    const content = (
        <div className="min-w-0 flex-1 truncate text-sm text-neutral-800">
            {value ?? "—"}
        </div>
    );
    return (
        <div className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-black/[0.03]">
            <div className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {label}
            </div>
            {href ? (
                <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="flex-1 min-w-0"
                >
                    <div className="group flex items-center gap-2">
                        {content}
                        <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                    </div>
                </a>
            ) : (
                content
            )}
        </div>
    );
};

const HeaderSkeleton = () => (
    <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
    </div>
);

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

export default function StockOutDetailSheet({
    stockoutId,
    open,
    onOpenChange,
}) {
    const [loading, setLoading] = useState(false);
    const [o, setO] = useState(null);

    const fetchDetail = useCallback(async () => {
        if (!open || !stockoutId) return;
        setLoading(true);
        try {
            const res = await superadmin.getStockOutDetail(stockoutId);
            setO(res?.data || null);
        } catch (err) {
            toast.error(
                err?.response?.data?.message ||
                err?.response?.data?.detail ||
                err?.message ||
                "Unable to load stockout"
            );
            setO(null);
        } finally {
            setLoading(false);
        }
    }, [open, stockoutId]);

    useEffect(() => {
        let ignore = false;
        (async () => {
            if (!open || !stockoutId) return;
            if (!ignore) await fetchDetail();
        })();
        return () => {
            ignore = true;
        };
    }, [open, stockoutId, fetchDetail]);

    const p = o?.product || {};
    const si = o?.stock_in || {};
    const order = o?.order || {};
    const user = o?.created_by || {};
    const title = p?.name || "Stockout";

    const code = o?.id || stockoutId;
    const created = o?.created_at ? new Date(o.created_at) : null;

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(String(code || ""));
            toast.success("Stockout ID copied");
        } catch {
            toast.error("Could not copy ID");
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="p-0 w-[min(1024px,100vw)] sm:max-w-[1024px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right border-l border-neutral-200 bg-white/90 backdrop-blur-xl"
            >
                {/* Top gradient */}
                <div
                    className="h-20 w-full"
                    style={{
                        background: "linear-gradient(90deg, var(--primary-color), #059669)",
                    }}
                />

                {/* Header */}
                <div className="-mt-10 px-5 sm:px-6">
                    <GlassCard className="p-4">
                        <SheetHeader className="mb-1">
                            <SheetTitle className="sr-only">Stockout details</SheetTitle>
                            {loading ? (
                                <HeaderSkeleton />
                            ) : (
                                <div className="flex flex-wrap items-center gap-3">
                                    {p?.image ? (
                                        <img
                                            src={p.image}
                                            alt={title}
                                            className="h-14 w-14 rounded-xl object-cover ring-1 ring-black/5"
                                        />
                                    ) : (
                                        <div
                                            className="grid h-14 w-14 place-items-center rounded-xl text-sm font-semibold text-white ring-1 ring-black/5"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, var(--primary-color), #059669)",
                                            }}
                                        >
                                            SO
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-xl font-semibold">
                                            {title}
                                        </div>
                                        <SheetDescription className="truncate text-xs">
                                            {o?.id || ""}
                                        </SheetDescription>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant={reasonVariant(o?.reason)}
                                            className="glass-badge"
                                        >
                                            {o?.reason || "—"}
                                        </Badge>
                                        <Badge
                                            variant={o?.is_void ? "destructive" : "secondary"}
                                            className="glass-badge"
                                        >
                                            {o?.is_void ? "Voided" : "Active"}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            onClick={copyCode}
                                            className="cursor-pointer px-6 py-4 rounded-4xl"
                                        >
                                            <ClipboardCopy className="mr-2 h-4 w-4" />
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </SheetHeader>
                    </GlassCard>
                </div>

                {/* Body */}
                <div className="px-5 pb-6 pt-4 sm:px-6">
                    <Separator className="my-4 border-neutral-200" />

                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-28 w-full rounded-xl" />
                            <Skeleton className="h-28 w-full rounded-xl" />
                            <Skeleton className="h-64 w-full rounded-xl" />
                        </div>
                    ) : !o?.id ? (
                        <div className="text-sm text-neutral-500">Stockout not found.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            {/* Left column */}
                            <div className="space-y-4 xl:col-span-2">
                                {/* Product */}
                                <GlassCard>
                                    <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                        <ShoppingBasket className="h-4 w-4" />
                                        Product
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <Row label="Name" value={p?.name} />
                                        <Row label="SKU" value={p?.sku} />
                                        <Row label="Barcode" value={p?.barcode} />
                                        <Row label="Category" value={p?.category} />
                                        <Row label="Brand" value={p?.brand} />
                                        <Row label="Unit" value={p?.unit_of_measure} />
                                        <Row
                                            label="Unit price"
                                            value={currency(p?.unit_price, o?.currency)}
                                        />
                                        <Row label="Tax %" value={p?.tax_rate_percent} />
                                    </div>
                                </GlassCard>

                                {/* Stock in (batch) */}
                                <GlassCard>
                                    <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                        <Boxes className="h-4 w-4" />
                                        Batch (Stock in)
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <Row label="Batch no." value={si?.batch_no} />
                                        <Row
                                            label="Expiry"
                                            value={
                                                si?.expiry_date
                                                    ? new Date(si.expiry_date).toLocaleDateString()
                                                    : "—"
                                            }
                                        />
                                        <Row
                                            label="Unit cost"
                                            value={
                                                si?.unit_cost != null
                                                    ? currency(si?.unit_cost, o?.currency)
                                                    : "—"
                                            }
                                        />
                                        <Row label="Qty received" value={si?.quantity} />
                                        <Row label="Qty issued" value={si?.issued_quantity} />
                                        <Row label="Qty remaining" value={si?.remaining_quantity} />
                                        <Row
                                            label="Received at"
                                            value={
                                                si?.created_at
                                                    ? new Date(si.created_at).toLocaleString()
                                                    : "—"
                                            }
                                        />
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Right column */}
                            <div className="space-y-4">
                                {/* Amounts */}
                                <GlassCard>
                                    <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                        <ReceiptText className="h-4 w-4" />
                                        Amounts
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <Row label="Quantity" value={o?.quantity} />
                                        <Row
                                            label="Unit price"
                                            value={currency(o?.unit_price, o?.currency)}
                                        />
                                        <Row
                                            label="Total value"
                                            value={currency(o?.value_total, o?.currency)}
                                        />
                                    </div>
                                </GlassCard>

                                {/* Order / Store / User */}
                                <GlassCard>
                                    <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                        <Warehouse className="h-4 w-4" />
                                        Context
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <Row
                                            label="Order"
                                            value={order?.code || order?.id || "—"}
                                        />
                                        <Row label="Store" value={o?.store?.name || "—"} />
                                        <Row
                                            label="Created by"
                                            value={user?.email || user?.username || user?.id || "—"}
                                        />
                                        <Row
                                            label="Created at"
                                            value={created ? created.toLocaleString() : "—"}
                                        />
                                    </div>
                                </GlassCard>

                                {/* Meta */}
                                <GlassCard>
                                    <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                        <BadgeCheck className="h-4 w-4" />
                                        Meta
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <Row label="ID" value={o?.id} />
                                        <Row label="Reason" value={o?.reason} />
                                        <Row label="Voided" value={o?.is_void ? "Yes" : "No"} />
                                    </div>
                                </GlassCard>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
