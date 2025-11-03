import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { superadmin } from "@/api";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
    Activity,
    AlertTriangle,
    CircleCheck,
    CircleX,
    ClipboardCopy,
    Factory,
    Hammer,
    Layers,
    MapPin,
    Package2,
    Refrigerator,
    ShieldOff,
    Shield,
    Trash2,
} from "lucide-react";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

/* -------------------------------- helpers --------------------------------- */
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

/* ------------------------------ glass wrappers ----------------------------- */
const Glass = ({ className = "", children }) => (
    <div
        className={[
            "rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur-md",
            className,
        ].join(" ")}
    >
        {children}
    </div>
);

/* -------------------------------- component -------------------------------- */
export default function StockInDetailSheet({ id, open, onOpenChange, onDone }) {
    const [loading, setLoading] = useState(false);
    const [payload, setPayload] = useState(null);

    const [voidCascade, setVoidCascade] = useState(true);
    const [deleteCascade, setDeleteCascade] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const isVoided = !!payload?.is_void;
    const product = payload?.product || {};
    const store = payload?.store || null;
    const q = payload?.quantities || {};
    const price = payload?.pricing || {};
    const costs = payload?.costs || {};
    const createdBy = payload?.created_by || null;
    const stats = payload?.product_stats || {};
    const stockouts = payload?.stockouts || [];
    const stockoutsCount = payload?.stockouts_count || 0;

    const fetchDetail = async () => {
        if (!open || !id) return;
        setLoading(true);
        try {
            const { data } = await superadmin.getStockInDetail(id, { include_void: true });
            setPayload(data?.data || null);
        } catch (err) {
            toast.error(err?.message || "Failed to load batch details.");
            setPayload(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, id]);

    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(String(id || ""));
            toast.success("Batch ID copied");
        } catch {
            toast.error("Could not copy");
        }
    };

    const toggleVoid = async () => {
        try {
            const next = !isVoided;
            const body = { is_void: next, cascade: !!voidCascade };
            const { message } = await superadmin.voidStockIn(id, body);
            toast.success(message || (next ? "Batch voided." : "Batch restored."));
            await fetchDetail();
        } catch (err) {
            toast.error(err?.message || "Failed to update batch.");
        }
    };

    const handleDelete = async () => {
        try {
            const { message } = await superadmin.deleteStockIn(id, { cascade: !!deleteCascade });
            toast.success(message || "Batch deleted.");
            setConfirmOpen(false);
            onDone?.(); // allow parent to refresh lists
            onOpenChange?.(false);
        } catch (err) {
            toast.error(err?.message || "Failed to delete batch.");
        }
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="right"
                    className="w-[min(980px,100vw)] sm:max-w-[980px] p-0 border-l bg-white/90 backdrop-blur-xl"
                >
                    <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--primary-color), #059669)" }} />
                    <div className="p-5 sm:p-6">
                        <SheetHeader className="mb-3">
                            <SheetTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-emerald-600" />
                                StockIn batch
                            </SheetTitle>
                            <SheetDescription>Inbound batch details, values, costs & events.</SheetDescription>
                        </SheetHeader>

                        {loading ? (
                            <div className="grid gap-3">
                                <Skeleton className="h-14 w-full rounded-xl" />
                                <Skeleton className="h-24 w-full rounded-xl" />
                                <Skeleton className="h-28 w-full rounded-xl" />
                            </div>
                        ) : !payload ? (
                            <Glass>
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    Could not load this batch.
                                </div>
                            </Glass>
                        ) : (
                            <>
                                {/* Header card */}
                                <Glass>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-lg font-semibold">{product?.name || "Product"}</div>
                                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                                                <Badge variant="secondary" className="glass-badge">{product?.category || "—"}</Badge>
                                                <span>· Received {dateOnly(payload?.dates?.received_at)}</span>
                                                {payload?.dates?.expiry_date && <span>· Exp {dateOnly(payload?.dates?.expiry_date)}</span>}
                                                <span>· Batch ID</span>
                                                <button
                                                    type="button"
                                                    onClick={copyId}
                                                    className="underline-offset-2 hover:underline"
                                                    title="Copy batch ID"
                                                >
                                                    {String(id).slice(0, 8)}…
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isVoided ? (
                                                <Badge variant="destructive" className="glass-badge flex items-center gap-1">
                                                    <ShieldOff className="h-3.5 w-3.5" /> Voided
                                                </Badge>
                                            ) : (
                                                <Badge variant="default" className="glass-badge flex items-center gap-1">
                                                    <Shield className="h-3.5 w-3.5" /> Active
                                                </Badge>
                                            )}
                                            {store?.name ? (
                                                <Badge variant="secondary" className="glass-badge flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5" /> {store.name}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="glass-badge flex items-center gap-1">
                                                    <Refrigerator className="h-3.5 w-3.5" /> Global
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </Glass>

                                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                                    {/* Left column */}
                                    <div className="space-y-4 lg:col-span-1">
                                        <Glass>
                                            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                                <Package2 className="h-4 w-4" />
                                                Quantities
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <div className="rounded-xl border border-black/5 bg-white/60 p-3">
                                                    <div className="text-xs uppercase text-neutral-500">Received</div>
                                                    <div className="text-lg font-semibold">{fmtNum(q.received)}</div>
                                                </div>
                                                <div className="rounded-xl border border-black/5 bg-white/60 p-3">
                                                    <div className="text-xs uppercase text-neutral-500">Issued</div>
                                                    <div className="text-lg font-semibold">{fmtNum(q.issued)}</div>
                                                </div>
                                                <div className="rounded-xl border border-black/5 bg-white/60 p-3">
                                                    <div className="text-xs uppercase text-neutral-500">Remaining</div>
                                                    <div className="text-lg font-semibold">{fmtNum(q.remaining)}</div>
                                                </div>
                                            </div>
                                        </Glass>

                                        <Glass>
                                            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                                <Factory className="h-4 w-4" />
                                                Pricing
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <div className="rounded-xl border border-black/5 bg-white/60 p-3">
                                                    <div className="text-xs uppercase text-neutral-500">Unit</div>
                                                    <div className="text-lg font-semibold">{fmtNum(price.unit_price)}</div>
                                                </div>
                                                <div className="rounded-xl border border-black/5 bg-white/60 p-3">
                                                    <div className="text-xs uppercase text-neutral-500">Tax %</div>
                                                    <div className="text-lg font-semibold">{fmtNum(price.tax_rate)}</div>
                                                </div>
                                                <div className="rounded-xl border border-black/5 bg-white/60 p-3">
                                                    <div className="text-xs uppercase text-neutral-500">Unit w/ tax</div>
                                                    <div className="text-lg font-semibold">{fmtNum(price.unit_price_with_tax)}</div>
                                                </div>

                                                <div className="rounded-xl border border-black/5 bg-white/60 p-3 col-span-3">
                                                    <div className="text-xs uppercase text-neutral-500">Gross value</div>
                                                    <div className="text-lg font-semibold">{fmtNum(price.value_gross)}</div>
                                                </div>
                                            </div>
                                        </Glass>

                                        <Glass>
                                            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                                <Hammer className="h-4 w-4" />
                                                Costs
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="rounded-xl border border-black/5 bg-white/60 p-3">
                                                    <div className="text-xs uppercase text-neutral-500">Unit cost</div>
                                                    <div className="text-lg font-semibold">{fmtNum(costs.unit_cost)}</div>
                                                </div>
                                                <div className="rounded-xl border border-black/5 bg-white/60 p-3">
                                                    <div className="text-xs uppercase text-neutral-500">Total cost</div>
                                                    <div className="text-lg font-semibold">{fmtNum(costs.total_cost)}</div>
                                                </div>
                                            </div>
                                        </Glass>
                                    </div>

                                    {/* Right column */}
                                    <div className="space-y-4 lg:col-span-2">
                                        <Glass>
                                            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                                <Activity className="h-4 w-4" />
                                                Product totals
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <div className="rounded-xl border border-black/5 bg-white/60 p-3">
                                                    <div className="text-xs uppercase text-neutral-500">Stock-in</div>
                                                    <div className="text-lg font-semibold">{fmtNum(stats.stockin_total)}</div>
                                                </div>
                                                <div className="rounded-xl border border-black/5 bg-white/60 p-3">
                                                    <div className="text-xs uppercase text-neutral-500">Stock-out</div>
                                                    <div className="text-lg font-semibold">{fmtNum(stats.stockout_total)}</div>
                                                </div>
                                                <div className="rounded-xl border border-black/5 bg-white/60 p-3">
                                                    <div className="text-xs uppercase text-neutral-500">Remaining</div>
                                                    <div className="text-lg font-semibold">{fmtNum(stats.remaining_total)}</div>
                                                </div>
                                            </div>

                                            <Separator className="my-3" />

                                            <div className="grid gap-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs uppercase text-neutral-500">Created by:</span>
                                                    <span className="font-medium">
                                                        {createdBy?.username || createdBy?.email || "—"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs uppercase text-neutral-500">Store:</span>
                                                    <span className="font-medium">{store?.name || "Global"}</span>
                                                </div>
                                            </div>
                                        </Glass>

                                        <Glass>
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                                    <Layers className="h-4 w-4" />
                                                    Stock-outs for this batch
                                                </div>
                                                <Badge variant="secondary" className="glass-badge">{stockoutsCount}</Badge>
                                            </div>
                                            <ScrollArea className="max-h-[38vh] pr-2">
                                                {(!stockouts || stockouts.length === 0) ? (
                                                    <div className="text-sm text-neutral-500">No stock-out events.</div>
                                                ) : (
                                                    <div className="grid gap-2">
                                                        {stockouts.map((s) => (
                                                            <div
                                                                key={s.id}
                                                                className="rounded-xl border border-black/5 bg-white/60 p-3 text-sm"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="min-w-0">
                                                                        <div className="truncate font-medium">
                                                                            {s?.stock_in?.store?.name || "Global"}
                                                                        </div>
                                                                        <div className="text-xs text-neutral-500">
                                                                            {dateOnly(s?.created_at)}
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant="secondary" className="glass-badge">
                                                                        -{fmtNum(s?.quantity)}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </Glass>
                                    </div>
                                </div>

                                {/* Actions bar */}
                                <div className="sticky bottom-0 mt-4 rounded-xl border border-black/5 bg-white/90 p-3 backdrop-blur-sm">
                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Void/Restore with cascade */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 rounded-xl border border-black/5 bg-white/60 px-3 py-2 text-sm">
                                                <Switch checked={!!voidCascade} onCheckedChange={setVoidCascade} />
                                                <span>Cascade stock-outs</span>
                                            </div>
                                            <Button variant={isVoided ? "default" : "destructive"} size="sm" onClick={toggleVoid} className="cursor-pointer rounded-4xl px-4 py-5">
                                                {isVoided ? (
                                                    <div className="text-white flex">
                                                        <CircleCheck className="mr-2 h-4 w-4" />
                                                        Restore batch
                                                    </div>
                                                ) : (
                                                    <>
                                                        <CircleX className="mr-2 h-4 w-4" />
                                                        Void batch
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <div className="ml-auto flex items-center gap-2">
                                            {/* Hard delete */}
                                            <div className="flex items-center gap-2 rounded-4xl border border-black/5 bg-white/60 px-3 py-2 text-sm">
                                                <Switch checked={!!deleteCascade} onCheckedChange={setDeleteCascade} />
                                                <span>Delete stock-outs first</span>
                                            </div>
                                                    <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)} className="cursor-pointer glass-cta-danger rounded-4xl px-4 py-5">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete batch
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete confirm dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="bg-white backdrop-blur-xl rounded-4xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-600" />
                            Delete this batch?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action permanently deletes the StockIn batch.
                            {deleteCascade ? (
                                <span> Child stock-outs will be deleted first.</span>
                            ) : (
                                <span> If the batch has stock-outs, deletion will be blocked.</span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="rounded-xl border border-black/5 bg-white/70 p-3 text-sm">
                        <div className="flex items-center gap-3">
                            <Switch checked={!!deleteCascade} onCheckedChange={setDeleteCascade} />
                            <span>Delete dependent stock-outs (cascade)</span>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer rounded-4xl px-4 py-5">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="glass-cta-danger text-white cursor-pointer rounded-4xl px-4 py-5"
                            onClick={handleDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
