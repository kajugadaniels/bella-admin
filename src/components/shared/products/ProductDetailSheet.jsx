import React, { useEffect, useState } from "react";
import {
    BadgeDollarSign,
    Boxes,
    CalendarClock,
    CircleAlert,
    ClipboardCopy,
    PackageOpen,
    ShoppingBasket,
    Store,
    Tag,
} from "lucide-react";
import { toast } from "sonner";
import { superadmin } from "@/api";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

function GlassCard({ className = "", children }) {
    return (
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
}

function Stat({ icon, label, value, hint }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white/70 p-3 backdrop-blur-md">
            <div
                className="grid h-10 w-10 place-items-center rounded-xl text-white ring-1 ring-black/5"
                style={{ background: "linear-gradient(135deg, var(--primary-color), #059669)" }}
            >
                {icon && React.createElement(icon, { className: "h-5 w-5" })}
            </div>
            <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
                <div className="flex items-baseline gap-2">
                    <div className="text-lg font-semibold tabular-nums">{value ?? "—"}</div>
                    {hint ? <div className="truncate text-xs text-neutral-500">{hint}</div> : null}
                </div>
            </div>
        </div>
    );
}

function fmtNum(n) {
    if (n === null || n === undefined) return "—";
    const num = Number(n);
    if (Number.isNaN(num)) return String(n);
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(num);
}
function dateOnly(iso) {
    if (!iso) return "—";
    try {
        return new Date(iso).toISOString().slice(0, 10);
    } catch {
        return String(iso);
    }
}

export default function ProductDetailSheet({ id, open, onOpenChange }) {
    const [loading, setLoading] = useState(false);
    const [payload, setPayload] = useState(null);

    useEffect(() => {
        let ignore = false;
        async function run() {
            if (!open || !id) return;
            setLoading(true);
            try {
                const { data, message } = await superadmin.getProductDetail(id, { limit_batches: 20, limit_stockouts: 20 });
                if (!ignore) {
                    setPayload(data?.data || null);
                    if (message) toast.success(message);
                }
            } catch (err) {
                if (!ignore) {
                    toast.error(err?.message || "Failed to fetch product details.");
                    setPayload(null);
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        run();
        return () => {
            ignore = true;
        };
    }, [id, open]);

    const product = payload?.product || {};
    const stats = payload?.stats || {};
    const stores = payload?.stores || [];
    const batches = payload?.batches || [];
    const stockouts = payload?.stockouts || [];

    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(product?.id || "");
            toast.success("Product ID copied");
        } catch {
            toast.error("Could not copy ID");
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="
          p-0 
          w-[min(980px,100vw)] sm:max-w-[980px]
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right
          border-l border-neutral-200 bg-white/90 backdrop-blur-xl
        "
            >
                {/* Top banner */}
                <div className="h-20 w-full" style={{ background: "linear-gradient(90deg, var(--primary-color), #059669)" }} />
                {/* Header */}
                <div className="-mt-10 px-5 sm:px-6">
                    <GlassCard className="p-4">
                        <SheetHeader className="mb-1">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="min-w-0">
                                    {loading ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-1/2" />
                                            <Skeleton className="h-4 w-1/3" />
                                        </div>
                                    ) : (
                                        <>
                                            <SheetTitle className="truncate text-xl font-semibold">{product?.name || "Product details"}</SheetTitle>
                                            <SheetDescription className="truncate text-xs">{product?.id || ""}</SheetDescription>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="glass-badge">
                                            {product?.category || "UNCAT"}
                                        </Badge>

                                        {product?.discount_rate > 0 && (
                                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                                -{fmtNum(product.discount_rate)}%
                                            </Badge>
                                        )}
                                    </div>

                                    <Button variant="outline" size="sm" onClick={copyId} className="cursor-pointer">
                                        <ClipboardCopy className="mr-2 h-4 w-4" />
                                        Copy ID
                                    </Button>
                                </div>
                            </div>
                        </SheetHeader>
                    </GlassCard>
                </div>

                {/* Body */}
                <div className="px-5 pb-6 pt-4 sm:px-6">
                    <Separator className="my-4 border-neutral-200" />

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {/* LEFT: Product & stats */}
                        <div className="space-y-4 lg:col-span-1">
                            <GlassCard>
                                <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                    <Tag className="h-4 w-4" />
                                    Product
                                </div>
                                {loading ? (
                                    <div className="grid gap-2">
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-1/3" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {/* Discounted price */}
                                        <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                                            <div className="text-xs uppercase text-neutral-500">Discounted</div>
                                            <div className="font-semibold text-emerald-700">{fmtNum(product?.unit_price)}</div>
                                        </div>

                                        {/* Original price */}
                                        <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                                            <div className="text-xs uppercase text-neutral-500">Original Price</div>
                                            <div className="font-semibold text-neutral-600 line-through decoration-red-500/70">
                                                {fmtNum(product?.original_price)}
                                            </div>
                                        </div>

                                        {/* Discount rate */}
                                        <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                                            <div className="text-xs uppercase text-neutral-500">Discount rate</div>
                                            <div className="font-semibold text-amber-600">
                                                {fmtNum(product?.discount_rate)}%
                                            </div>
                                        </div>

                                        {/* Tax rate */}
                                        <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                                            <div className="text-xs uppercase text-neutral-500">Tax %</div>
                                            <div className="font-semibold">{fmtNum(product?.tax_rate)}</div>
                                        </div>

                                        {/* Discounted with tax */}
                                        <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                                            <div className="text-xs uppercase text-neutral-500">Discounted + tax</div>
                                            <div className="font-semibold text-emerald-700">
                                                {fmtNum(product?.discounted_price_with_tax || product?.unit_price_with_tax)}
                                            </div>
                                        </div>

                                        {/* Original with tax */}
                                        <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                                            <div className="text-xs uppercase text-neutral-500">Original + tax</div>
                                            <div className="font-semibold text-neutral-600 line-through decoration-red-500/70">
                                                {fmtNum(product?.original_price_with_tax || product?.discount_price_with_tax)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </GlassCard>

                            <div className="grid grid-cols-2 gap-3">
                                <Stat icon={Boxes} label="Batches" value={stats?.batch_count ?? "—"} hint="" />
                                <Stat icon={CalendarClock} label="With expiry" value={stats?.batches_with_expiry ?? "—"} hint="" />
                                <Stat icon={PackageOpen} label="Stock in" value={fmtNum(stats?.stockin_total)} hint="" />
                                <Stat icon={ShoppingBasket} label="Stock out" value={fmtNum(stats?.stockout_total)} hint="" />
                                <Stat icon={BadgeDollarSign} label="Remaining" value={fmtNum(stats?.remaining_total)} hint="" />
                            </div>
                        </div>

                        {/* RIGHT: Stores / Batches / Stock-outs */}
                        <div className="lg:col-span-2 space-y-4">
                            <GlassCard className="p-0">
                                <div className="px-3 pt-3 pb-2 text-xs font-medium uppercase tracking-wide text-neutral-600 flex items-center gap-2">
                                    <Store className="h-4 w-4" />
                                    Per-store totals
                                </div>
                                <ScrollArea className="max-h-[30vh] pr-2">
                                    {loading ? (
                                        <div className="space-y-2 p-3">
                                            <Skeleton className="h-10 w-full rounded-lg" />
                                            <Skeleton className="h-10 w-full rounded-lg" />
                                            <Skeleton className="h-10 w-full rounded-lg" />
                                        </div>
                                    ) : !stores?.length ? (
                                        <div className="flex items-center gap-2 p-4 text-sm text-neutral-500">
                                            <CircleAlert className="h-4 w-4" />
                                            No store breakdown available.
                                        </div>
                                    ) : (
                                        <div className="grid gap-2 p-2">
                                            {stores.map((s, i) => (
                                                <div key={i} className="grid grid-cols-5 items-center gap-2 rounded-xl p-2 transition-colors hover:bg-black/[0.03]">
                                                    <div className="col-span-2 truncate text-sm">{s.name || "Global"}</div>
                                                    <div className="text-right text-sm">{fmtNum(s.received_total)}</div>
                                                    <div className="text-right text-sm">{fmtNum(s.issued_total)}</div>
                                                    <div className="text-right text-sm font-semibold">{fmtNum(s.remaining_total)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </GlassCard>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Batches */}
                                <GlassCard className="p-0">
                                    <div className="px-3 pt-3 pb-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                        Recent batches
                                    </div>
                                    <ScrollArea className="max-h-[36vh] pr-2">
                                        {loading ? (
                                            <div className="space-y-2 p-3">
                                                <Skeleton className="h-10 w-full rounded-lg" />
                                                <Skeleton className="h-10 w-full rounded-lg" />
                                                <Skeleton className="h-10 w-full rounded-lg" />
                                            </div>
                                        ) : !batches?.length ? (
                                            <div className="flex items-center gap-2 p-4 text-sm text-neutral-500">
                                                <CircleAlert className="h-4 w-4" />
                                                No recent batches.
                                            </div>
                                        ) : (
                                            <div className="grid gap-2 p-2">
                                                {batches.map((b) => (
                                                    <div key={b.id} className="rounded-xl p-2 transition-colors hover:bg-black/[0.03]">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-medium">{b.store?.name || "Global"}</div>
                                                                <div className="text-xs text-neutral-500">
                                                                    Received {dateOnly(b.dates?.received_at)}
                                                                    {b.dates?.expiry_date && <> · Exp {dateOnly(b.dates?.expiry_date)}</>}
                                                                </div>
                                                            </div>
                                                            <Badge variant={b.is_void ? "destructive" : "secondary"} className="glass-badge">
                                                                {b.is_void ? "Voided" : "Active"}
                                                            </Badge>
                                                        </div>
                                                        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                                            <div className="rounded-lg border border-black/5 bg-white/60 p-2">
                                                                <div className="text-xs uppercase text-neutral-500">Remaining</div>
                                                                <div className="font-semibold">{fmtNum(b.quantities?.remaining)}</div>
                                                            </div>
                                                            <div className="rounded-lg border border-black/5 bg-white/60 p-2">
                                                                <div className="text-xs uppercase text-neutral-500">Discounted</div>
                                                                <div className="font-semibold text-emerald-700">{fmtNum(b.pricing?.unit_price)}</div>
                                                            </div>
                                                            <div className="rounded-lg border border-black/5 bg-white/60 p-2">
                                                                <div className="text-xs uppercase text-neutral-500">Original P</div>
                                                                <div className="font-semibold text-neutral-600 line-through decoration-red-500/70">
                                                                    {fmtNum(b.product?.original_price || product?.original_price)}
                                                                </div>
                                                            </div>
                                                            <div className="rounded-lg border border-black/5 bg-white/60 p-2">
                                                                <div className="text-xs uppercase text-neutral-500">Gross value</div>
                                                                <div className="font-semibold">{fmtNum(b.pricing?.value_gross)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </GlassCard>

                                {/* Stock-outs */}
                                <GlassCard className="p-0">
                                    <div className="px-3 pt-3 pb-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                        Recent stock-outs
                                    </div>
                                    <ScrollArea className="max-h-[36vh] pr-2">
                                        {loading ? (
                                            <div className="space-y-2 p-3">
                                                <Skeleton className="h-10 w-full rounded-lg" />
                                                <Skeleton className="h-10 w-full rounded-lg" />
                                                <Skeleton className="h-10 w-full rounded-lg" />
                                            </div>
                                        ) : !stockouts?.length ? (
                                            <div className="flex items-center gap-2 p-4 text-sm text-neutral-500">
                                                <CircleAlert className="h-4 w-4" />
                                                No recent stock-outs.
                                            </div>
                                        ) : (
                                            <div className="grid gap-2 p-2">
                                                {stockouts.map((o) => (
                                                    <div key={o.id} className="grid grid-cols-3 items-center gap-2 rounded-xl p-2 transition-colors hover:bg-black/[0.03]">
                                                        <div className="truncate text-sm col-span-2">{o.stock_in__store__name || "Global"}</div>
                                                        <div className="text-right text-sm font-medium">{fmtNum(o.quantity)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </GlassCard>
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
