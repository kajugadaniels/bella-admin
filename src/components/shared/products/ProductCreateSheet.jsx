import React, { useMemo, useState, useEffect } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { superadmin } from "@/api";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Store } from "lucide-react";

/* --------------------------------- constants -------------------------------- */
const CATEGORY_OPTIONS = [
    "DRINKS",
    "DAIRY",
    "BAKERY",
    "FRUITS",
    "SNACKS",
    "MEAT",
    "FROZEN",
    "CLEANING",
    "PERSONAL_CARE",
    "OTHER",
];

/* --------------------------------- schema --------------------------------- */
const BatchSchema = z.object({
    store_id: z.string().uuid().optional().or(z.literal("")).nullable(),
    quantity: z.string().min(1, "Quantity is required"),
    expiry_date: z.string().optional().or(z.literal("")),
});

const ProductSchema = z.object({
    name: z.string().min(2, "Name is required"),
    category: z.string().min(2, "Category is required"),
    unit_price: z.string().min(1, "Unit price is required"),
    stockins: z.array(BatchSchema).min(1, "Add at least one batch"),
});

/* ------------------------------ store search UI ------------------------------ */
function AsyncStoreSelect({
    value,
    onChange,
    placeholder = "Search store…",
    disabled = false,
    maxHeightClass = "max-h-80 sm:max-h-[28rem]", // ensures scrolling when long
}) {
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [opts, setOpts] = useState([]);

    useEffect(() => {
        let ignore = false;
        async function run() {
            setLoading(true);
            try {
                const params = {};
                if (q.trim()) params.search = q.trim();
                params.ordering = "name";
                const { data } = await superadmin.listStores(params);
                if (!ignore) setOpts(data?.results || []);
            } catch {
                if (!ignore) setOpts([]);
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        run();
        return () => {
            ignore = true;
        };
    }, [q]);

    const current = useMemo(() => opts.find((o) => o.id === value) || null, [opts, value]);

    return (
        <div className={`relative ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
            {value ? (
                <div className="flex items-center justify-between rounded-xl border border-black/5 bg-white/70 px-3 py-2 text-sm backdrop-blur dark:border-white/10 dark:bg-neutral-900/60">
                    <div className="min-w-0">
                        <div className="truncate font-medium">{current?.name || "Selected store"}</div>
                        <div className="truncate text-xs text-neutral-500">{value}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onChange?.("")} className="cursor-pointer">
                        Clear
                    </Button>
                </div>
            ) : (
                <>
                    <div className="relative">
                        <Store className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder={placeholder}
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <div className="absolute z-10 mt-2 w-full rounded-xl border border-black/5 bg-white/95 p-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/95">
                        <ScrollArea className={`${maxHeightClass} overflow-auto`}>
                            {/* Global option */}
                            <button
                                type="button"
                                onClick={() => onChange?.("")}
                                className="mb-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-black/[0.03] dark:hover:bg-white/5"
                            >
                                <span className="truncate">No store (Global)</span>
                                <Badge variant="secondary" className="glass-badge">Global</Badge>
                            </button>

                            {loading ? (
                                <div className="grid gap-2 p-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-9 w-full rounded-md" />
                                    ))}
                                </div>
                            ) : (opts || []).length === 0 ? (
                                <div className="p-2 text-sm text-neutral-500">No stores found.</div>
                            ) : (
                                <div className="grid">
                                    {/* Show all; ScrollArea handles overflow */}
                                    {opts.map((o) => (
                                        <button
                                            type="button"
                                            key={o.id}
                                            onClick={() => onChange?.(o.id)}
                                            className="flex items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/5"
                                        >
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{o.name}</div>
                                                <div className="truncate text-xs text-neutral-500">{o.id}</div>
                                            </div>
                                            <Badge variant={o.has_admin ? "default" : "secondary"} className="ml-auto glass-badge">
                                                {o.has_admin ? "Has admin" : "No admin"}
                                            </Badge>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </>
            )}
        </div>
    );
}

/* ------------------------------- live helpers ------------------------------- */
function toNum(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
}

export default function ProductCreateSheet({ open, onOpenChange, onDone }) {
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        resolver: zodResolver(ProductSchema),
        defaultValues: {
            name: "",
            category: CATEGORY_OPTIONS[0],
            unit_price: "",
            stockins: [{ store_id: "", quantity: "", expiry_date: "" }],
        },
        mode: "onChange",
    });

    const { control, register, watch, handleSubmit, reset, setValue } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "stockins" });

    const unitPrice = toNum(watch("unit_price"));
    const priceWithTax = useMemo(() => unitPrice * 1.18, [unitPrice]); // UI preview (server enforces 18%)

    const totals = useMemo(() => {
        const arr = watch("stockins") || [];
        let totalQty = 0;
        let totalNet = 0;
        let totalGross = 0;
        arr.forEach((b) => {
            const q = toNum(b.quantity);
            totalQty += q;
            totalNet += q * unitPrice;
            totalGross += q * priceWithTax;
        });
        return {
            qty: totalQty,
            net: totalNet,
            gross: totalGross,
        };
    }, [watch, unitPrice, priceWithTax]);

    const canSubmit = form.formState.isValid && !submitting;

    const onSubmit = handleSubmit(async (values) => {
        try {
            setSubmitting(true);
            // Build payload (send numbers as strings to keep decimals friendly)
            const payload = {
                name: values.name,
                category: values.category,
                unit_price: String(values.unit_price),
                stockins: values.stockins.map((b) => ({
                    ...(b.store_id ? { store_id: b.store_id } : {}),
                    quantity: String(b.quantity),
                    ...(b.expiry_date ? { expiry_date: b.expiry_date } : {}),
                })),
            };
            const { message } = await superadmin.createProductWithStockIn(payload);
            toast.success(message || "Product created with initial stock.");
            onDone?.();
            onOpenChange?.(false);
            reset();
            // Reset defaults after closing to preserve UX next open
            setValue("category", CATEGORY_OPTIONS[0]);
        } catch (err) {
            toast.error(err?.message || "Failed to create product.");
        } finally {
            setSubmitting(false);
        }
    });

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[min(820px,100vw)] sm:max-w-[820px] p-0 border-l bg-white/90 backdrop-blur-xl dark:bg-neutral-950/85"
            >
                <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--primary-color), #059669)" }} />
                <div className="p-5 sm:p-6">
                    <SheetHeader className="mb-3">
                        <SheetTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-emerald-600" />
                            New product
                        </SheetTitle>
                        <SheetDescription>Create a product and add one or more initial stock-in batches.</SheetDescription>
                    </SheetHeader>

                    {/* Product block */}
                    <div className="rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm font-semibold">Product</div>
                            <Badge variant="secondary" className="glass-badge">
                                Tax: 18%
                            </Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="grid gap-1.5 sm:col-span-2">
                                <Label>Name</Label>
                                <Input placeholder="e.g., Premium Orange Juice 1L" {...register("name")} />
                            </div>

                            {/* Category now a select */}
                            <div className="grid gap-1.5">
                                <Label htmlFor="category">Category</Label>
                                <select
                                    id="category"
                                    {...register("category")}
                                    className="h-9 w-full rounded-xl border border-black/5 bg-white/90 px-3 text-sm outline-none transition-[box-shadow] focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-neutral-900"
                                >
                                    {CATEGORY_OPTIONS.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-neutral-500">Choose a category that best fits the product.</p>
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Unit price</Label>
                                <Input type="number" step="0.01" placeholder="0.00" {...register("unit_price")} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Price w/ tax (preview)</Label>
                                <div className="rounded-xl border border-black/5 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900/60">
                                    {priceWithTax ? priceWithTax.toFixed(2) : "—"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Batches */}
                    <div className="mt-4 rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm font-semibold">Initial stock-in batches</div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => append({ store_id: "", quantity: "", expiry_date: "" })}
                                className="cursor-pointer"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add batch
                            </Button>
                        </div>

                        <div className="grid gap-3">
                            {fields.map((f, idx) => (
                                <div
                                    key={f.id}
                                    className="rounded-xl border border-black/5 bg-white/60 p-3 dark:border-white/10 dark:bg-neutral-900/40"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="text-sm font-medium">Batch #{idx + 1}</div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => remove(idx)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove
                                        </Button>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="grid gap-1.5 md:col-span-2">
                                            <Label>Store (optional)</Label>
                                            <Controller
                                                control={control}
                                                name={`stockins.${idx}.store_id`}
                                                render={({ field }) => (
                                                    <AsyncStoreSelect
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        maxHeightClass="max-h-80 sm:max-h-[12rem] cursor-pointer" // scroll when long
                                                    />
                                                )}
                                            />
                                            <p className="text-xs text-neutral-500">Leave empty for a global batch (no store).</p>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Quantity</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                {...register(`stockins.${idx}.quantity`)}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Expiry date (optional)</Label>
                                            <Input type="date" {...register(`stockins.${idx}.expiry_date`)} />
                                        </div>
                                    </div>

                                    {/* Live calc per batch */}
                                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                                        <div className="rounded-lg border border-black/5 bg-white/60 p-2 dark:border-white/10 dark:bg-neutral-900/50">
                                            <div className="text-xs uppercase text-neutral-500">Value net</div>
                                            <div className="font-semibold">
                                                {(() => {
                                                    const q = toNum(form.getValues(`stockins.${idx}.quantity`));
                                                    return (q * unitPrice || 0).toFixed(2);
                                                })()}
                                            </div>
                                        </div>
                                        <div className="rounded-lg border border-black/5 bg-white/60 p-2 dark:border-white/10 dark:bg-neutral-900/50">
                                            <div className="text-xs uppercase text-neutral-500">Value gross</div>
                                            <div className="font-semibold">
                                                {(() => {
                                                    const q = toNum(form.getValues(`stockins.${idx}.quantity`));
                                                    return (q * priceWithTax || 0).toFixed(2);
                                                })()}
                                            </div>
                                        </div>
                                        <div className="rounded-lg border border-black/5 bg-white/60 p-2 dark:border-white/10 dark:bg-neutral-900/50">
                                            <div className="text-xs uppercase text-neutral-500">Price w/ tax</div>
                                            <div className="font-semibold">{priceWithTax ? priceWithTax.toFixed(2) : "—"}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                            <div className="rounded-xl border border-black/5 bg-white/70 p-3 dark:border-white/10 dark:bg-neutral-900/60">
                                <div className="text-xs uppercase text-neutral-500">Total qty</div>
                                <div className="text-lg font-semibold">{totals.qty.toFixed(2)}</div>
                            </div>
                            <div className="rounded-xl border border-black/5 bg-white/70 p-3 dark:border-white/10 dark:bg-neutral-900/60">
                                <div className="text-xs uppercase text-neutral-500">Total net value</div>
                                <div className="text-lg font-semibold">{totals.net.toFixed(2)}</div>
                            </div>
                            <div className="rounded-xl border border-black/5 bg-white/70 p-3 dark:border-white/10 dark:bg-neutral-900/60">
                                <div className="text-xs uppercase text-neutral-500">Total gross value</div>
                                <div className="text-lg font-semibold">{totals.gross.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom actions */}
                    <div className="sticky bottom-0 mt-4 rounded-xl border border-black/5 bg-white/90 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/70">
                        <div className="flex items-center justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => onOpenChange?.(false)} className="cursor-pointer">
                                Cancel
                            </Button>
                            <Button type="button" disabled={!canSubmit} onClick={onSubmit} className="cursor-pointer text-white">
                                {submitting ? "Creating…" : "Create product"}
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
