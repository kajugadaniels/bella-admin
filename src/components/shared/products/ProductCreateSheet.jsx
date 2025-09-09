import React, { useMemo, useState, useEffect, useCallback } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { superadmin } from "@/api";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Store, Image as ImageIcon, X } from "lucide-react";

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
    image: z.any().optional().nullable(), // File from dropzone
});

/* ------------------------------- helpers ---------------------------------- */
function toNum(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
}

/* ------------------------------ Store picker ------------------------------ */
/** Popover-based async store search. Closed by default; opens on click. */
function AsyncStoreSelect({
    value,
    onChange,
    placeholder = "Choose store…",
    disabled = false,
    buttonClassName = "",
}) {
    const [open, setOpen] = useState(false);
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
        if (open) run();
        return () => {
            ignore = true;
        };
    }, [q, open]);

    const current = useMemo(() => opts.find((o) => o.id === value) || null, [opts, value]);
    const label = current?.name || (value ? "Selected store" : "No store (Global)");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={disabled}>
                <Button
                    type="button"
                    variant="outline"
                    className={`h-9 w-full justify-between rounded-xl border border-black/5 bg-white/90 px-3 text-sm dark:border-white/10 dark:bg-neutral-900 ${buttonClassName}`}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <Store className="h-4 w-4 shrink-0 text-neutral-400" />
                        <span className="truncate">{label}</span>
                    </div>
                    <span className="text-xs text-neutral-500">Change</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(560px,90vw)] p-2 rounded-xl border border-black/5 bg-white/95 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/95">
                <div className="space-y-2">
                    <div className="relative">
                        <Input
                            placeholder="Search store…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="pl-3"
                        />
                    </div>
                    <div className="rounded-lg border border-black/5 bg-white/90 p-1 dark:border-white/10 dark:bg-neutral-900/80">
                        <ScrollArea className="max-h-64">
                            <div className="grid gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange?.("");
                                        setOpen(false);
                                    }}
                                    className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-black/[0.03] dark:hover:bg-white/5"
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
                                    opts.map((o) => (
                                        <button
                                            type="button"
                                            key={o.id}
                                            onClick={() => {
                                                onChange?.(o.id);
                                                setOpen(false);
                                            }}
                                            className="flex items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/5"
                                        >
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{o.name}</div>
                                                <div className="truncate text-xs text-neutral-500">{o.id}</div>
                                            </div>
                                            <Badge variant={o.has_admin ? "default" : "secondary"} className="ml-auto glass-badge">
                                                {o.has_admin ? "Has admin" : "No admin"}
                                            </Badge>
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

/* ----------------------------- Image Dropzone ------------------------------ */
function ImageDropzone({ value, onChange }) {
    const [preview, setPreview] = useState("");

    useEffect(() => {
        if (value instanceof File) {
            const url = URL.createObjectURL(value);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreview("");
    }, [value]);

    const onDrop = useCallback(
        (accepted) => {
            const file = accepted?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image too large (max 5MB).");
                return;
            }
            onChange?.(file);
        },
        [onChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] },
        maxFiles: 1,
        multiple: false,
        onDrop,
    });

    return (
        <div className="space-y-2">
            <div
                {...getRootProps()}
                className={`group relative flex cursor-pointer items-center justify-center rounded-2xl border border-dashed p-4 transition
          ${isDragActive ? "border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-900/20" : "border-black/10 bg-white/70 dark:border-white/10 dark:bg-neutral-900/40"}`}
            >
                <input {...getInputProps()} />
                {!value ? (
                    <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                        <ImageIcon className="h-5 w-5" />
                        <div className="text-center">
                            <div className="font-medium">Drag & drop product image</div>
                            <div className="text-xs">or click to browse (JPEG/PNG, max 5MB)</div>
                        </div>
                    </div>
                ) : (
                    <div className="flex w-full items-center gap-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-black/5 dark:border-white/10">
                            {preview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt="preview" src={preview} className="h-full w-full object-cover" />
                            ) : (
                                <ImageIcon className="m-auto h-6 w-6 text-neutral-400" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{value.name}</div>
                            <div className="text-xs text-neutral-500">
                                {(value.size / 1024).toFixed(0)} KB • {value.type || "image/*"}
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            className="shrink-0 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                                e.preventDefault();
                                onChange?.(null);
                            }}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Remove
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ============================= Main component ============================= */
export default function ProductCreateSheet({ open, onOpenChange, onDone }) {
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState(
        /** @type {Array<{value:string; label:string}>} */([])
    );
    const [catLoading, setCatLoading] = useState(true);

    // Load categories from backend
    useEffect(() => {
        let ignore = false;
        async function load() {
            setCatLoading(true);
            try {
                const { data } = await superadmin.getProductCategories();
                const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

                // Normalize to { value, label } and de-dupe by value
                const norm = raw
                    .map((item) => {
                        if (typeof item === "string") return { value: item, label: item };
                        const value = String(
                            item?.code ?? item?.value ?? item?.id ?? item?.name ?? ""
                        ).trim();
                        const label = String(
                            item?.label ?? item?.name ?? item?.title ?? item?.code ?? item?.value ?? value
                        ).trim();
                        return value ? { value, label } : null;
                    })
                    .filter(Boolean);

                const unique = Array.from(new Map(norm.map((o) => [o.value, o])).values());

                if (!ignore) setCategories(unique);
            } catch {
                if (!ignore) setCategories([]);
            } finally {
                if (!ignore) setCatLoading(false);
            }
        }
        load();
        return () => { ignore = true; };
    }, []);

    const form = useForm({
        resolver: zodResolver(ProductSchema),
        defaultValues: {
            name: "",
            category: "",
            unit_price: "",
            stockins: [{ store_id: "", quantity: "", expiry_date: "" }],
            image: null,
        },
        mode: "onChange",
    });

    const { control, register, watch, handleSubmit, reset, setValue } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "stockins" });

    // Initialize category once categories load
    useEffect(() => {
        if (!catLoading) {
            const current = form.getValues("category");
            const first = categories?.[0]?.value || "";
            if (!current && first) setValue("category", first, { shouldValidate: true });
        }
    }, [catLoading, categories]);

    const unitPrice = toNum(watch("unit_price"));
    const priceWithTax = useMemo(() => unitPrice * 1.18, [unitPrice]);

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
        return { qty: totalQty, net: totalNet, gross: totalGross };
    }, [watch, unitPrice, priceWithTax]);

    const canSubmit = form.formState.isValid && !submitting;

    const onSubmit = handleSubmit(async (values) => {
        try {
            setSubmitting(true);
            const payload = {
                name: values.name,
                category: values.category,
                unit_price: String(values.unit_price),
                stockins: values.stockins.map((b) => ({
                    ...(b.store_id ? { store_id: b.store_id } : {}),
                    quantity: String(b.quantity),
                    ...(b.expiry_date ? { expiry_date: b.expiry_date } : {}),
                })),
                ...(values.image instanceof File ? { image: values.image } : {}), // triggers multipart in api helper
            };
            const { message } = await superadmin.createProductWithStockIn(payload);
            toast.success(message || "Product created with initial stock.");
            onDone?.();
            onOpenChange?.(false);
            reset({
                name: "",
                category: categories?.[0]?.value || "",
                unit_price: "",
                stockins: [{ store_id: "", quantity: "", expiry_date: "" }],
                image: null,
            });
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
                className="w-[min(920px,100vw)] sm:max-w-[920px] p-0 border-l bg-white/90 backdrop-blur-xl dark:bg-neutral-950/85"
            >
                {/* Top accent */}
                <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--primary-color), #059669)" }} />

                {/* Scrollable content area */}
                <div className="flex h-[calc(100vh-0.375rem)] flex-col">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6">
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
                                <Badge variant="secondary" className="glass-badge">Tax: 18%</Badge>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                {/* Name */}
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label>Name</Label>
                                    <Input placeholder="e.g., Premium Orange Juice 1L" {...register("name")} />
                                </div>

                                {/* Category (Select) */}
                                <div className="grid gap-1.5">
                                    <Label htmlFor="category">Category</Label>
                                    <Controller
                                        control={control}
                                        name="category"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange} disabled={catLoading || !categories.length}>
                                                <SelectTrigger className="h-9 w-full rounded-xl border border-black/5 bg-white/90 px-3 text-sm dark:border-white/10 dark:bg-neutral-900">
                                                    <SelectValue placeholder={catLoading ? "Loading…" : "Select a category"} />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border border-black/5 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-neutral-900/95">
                                                    {categories.length ? (
                                                        categories.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="p-2 text-sm text-neutral-500">No categories.</div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    <p className="text-xs text-neutral-500">Choose a category from backend.</p>
                                </div>

                                {/* Unit price */}
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

                                {/* Image Dropzone (spans full width on small, two cols on large) */}
                                <div className="sm:col-span-3">
                                    <Label>Image (optional)</Label>
                                    <Controller
                                        control={control}
                                        name="image"
                                        render={({ field }) => (
                                            <ImageDropzone value={field.value} onChange={field.onChange} />
                                        )}
                                    />
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
                                    className="cursor-pointer text-white rounded-4xl px-4 py-5 glass-cta"
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
                                                className="text-red-600 hover:text-red-700 cursor-pointer"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remove
                                            </Button>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-3">
                                            {/* Store (Popover, closed by default) */}
                                            <div className="grid gap-1.5 md:col-span-2">
                                                <Label>Store (optional)</Label>
                                                <Controller
                                                    control={control}
                                                    name={`stockins.${idx}.store_id`}
                                                    render={({ field }) => (
                                                        <AsyncStoreSelect
                                                            value={field.value || ""}
                                                            onChange={field.onChange}
                                                            buttonClassName=""
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
                    </div>

                    {/* Bottom actions — pinned at the very bottom of the sheet */}
                    <div className="sticky bottom-0 mt-4 rounded-none border-t border-black/5 bg-white/90 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/70">
                        <div className="flex items-center justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => onOpenChange?.(false)} className="cursor-pointer rounded-4xl px-4 py-5">
                                Cancel
                            </Button>
                            <Button type="button" disabled={!canSubmit} onClick={onSubmit} className="cursor-pointer text-white rounded-4xl px-4 py-5 glass-cta">
                                {submitting ? "Creating…" : "Create product"}
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
