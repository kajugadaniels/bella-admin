import React, { useEffect, useMemo, useState, useCallback } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
    Calculator,
    ImageIcon,
    Save,
    XCircle,
    X,
    Plus,
    Store as StoreIcon,
    Trash2,
} from "lucide-react";

import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

/* ---------------------------------- schema --------------------------------- */
const BatchSchema = z.object({
    // existing batches come with id; new ones omit id
    id: z.string().uuid().optional(),
    store_id: z
        .string()
        .uuid()
        .optional()
        .or(z.literal(""))
        .nullable(),
    quantity: z.string().optional().or(z.literal("")),
    expiry_date: z.string().min(1, "Expiry date is required"),
});

const UpdateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    category: z.string().min(1, "Category is required"),
    unit_price: z.string().optional().or(z.literal("")),
    tax_rate: z.string().optional().or(z.literal("")), // percent, e.g., 18.00
    sku: z.string().optional().or(z.literal("")),
    barcode: z.string().optional().or(z.literal("")),
    brand: z.string().optional().or(z.literal("")),
    unit_of_measure: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
    remove_image: z.boolean().default(false),

    // StockIn updates (existing + new)
    batches: z.array(BatchSchema).default([]),
});

/* ----------------------------- utilities ----------------------------- */
function toNum(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
}

/* ----------------------------- Image Dropzone ----------------------------- */
function ImageDropzone({ file, onFileChange, removeFlag, onToggleRemove, serverImage }) {
    const onDrop = useCallback(
        (acceptedFiles) => {
            if (acceptedFiles && acceptedFiles.length > 0) {
                onFileChange(acceptedFiles[0]);
                if (removeFlag) onToggleRemove(false);
            }
        },
        [onFileChange, onToggleRemove, removeFlag]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        multiple: false,
    });

    const showServerImage = !!serverImage && !file && !removeFlag;

    return (
        <div
            {...getRootProps()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white/70 p-4 text-center text-sm text-neutral-500 backdrop-blur hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer"
        >
            <input {...getInputProps()} />
            {file ? (
                <div className="relative">
                    <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="h-32 w-32 rounded-lg object-cover shadow-md"
                    />
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onFileChange(null);
                        }}
                        className="absolute -top-2 -right-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : showServerImage ? (
                <div className="relative">
                    <img
                        src={serverImage}
                        alt="Current"
                        className="h-32 w-32 rounded-lg object-cover shadow-md"
                    />
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleRemove(true);
                        }}
                        className="absolute -top-2 -right-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <>
                    <ImageIcon className="mb-2 h-8 w-8 text-neutral-400" />
                    {isDragActive ? "Drop image here…" : "Drag & drop or click to upload product image"}
                </>
            )}
        </div>
    );
}

/* ----------------------------- Store Picker (closed by default) ----------------------------- */
function StorePicker({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [opts, setOpts] = useState([]);

    useEffect(() => {
        if (!open) return;
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
    }, [open, q]);

    const current = useMemo(() => opts.find((o) => o.id === value) || null, [opts, value]);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-black/5 bg-white/70 px-3 py-2 text-left text-sm backdrop-blur transition hover:bg-white/80"
            >
                <span className="flex items-center gap-2">
                    <StoreIcon className="h-4 w-4 text-neutral-400" />
                    {value ? (current?.name || value) : "Select store (optional)"}
                </span>
                <span className="text-xs text-neutral-500">{open ? "Close" : "Open"}</span>
            </button>

            {open && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-black/5 bg-white/95 p-2 shadow-lg backdrop-blur-sm">
                    <div className="relative mb-2">
                        <Input
                            placeholder="Search stores…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="pl-8"
                        />
                        <StoreIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    </div>

                    <div className="grid">
                        <button
                            type="button"
                            onClick={() => {
                                onChange("");
                                setOpen(false);
                            }}
                            className="mb-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-black/[0.03]"
                        >
                            <span className="truncate">No store (Global)</span>
                            <Badge variant="secondary" className="glass-badge">
                                Global
                            </Badge>
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
                                        onChange(o.id);
                                        setOpen(false);
                                    }}
                                    className="flex items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-black/[0.03]"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium">{o.name}</div>
                                        <div className="truncate text-xs text-neutral-500">{o.id}</div>
                                    </div>
                                    <Badge
                                        variant={o.has_admin ? "default" : "secondary"}
                                        className="ml-auto glass-badge"
                                    >
                                        {o.has_admin ? "Has admin" : "No admin"}
                                    </Badge>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* --------------------------------- component -------------------------------- */
export default function ProductUpdateSheet({ id, open, onOpenChange, onDone }) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Image state
    const [imageFile, setImageFile] = useState(null);
    const [serverImage, setServerImage] = useState(null);
    const [removeImage, setRemoveImage] = useState(false);

    // Categories (from backend)
    const [catLoading, setCatLoading] = useState(false);
    const [categories, setCategories] = useState(
    /** @type {Array<{value:string; label:string}>} */([])
    );

    const form = useForm({
        resolver: zodResolver(UpdateSchema),
        defaultValues: {
            name: "",
            category: "",
            unit_price: "",
            tax_rate: "",
            sku: "",
            barcode: "",
            brand: "",
            unit_of_measure: "",
            description: "",
            is_active: true,
            remove_image: false,
            batches: [],
        },
        mode: "onChange",
    });

    const { control } = form;
    const { fields, append, remove } = useFieldArray({
        control,
        name: "batches",
        keyName: "__key", // stable key for React lists
    });

    // Derived price preview
    const unitPrice = toNum(form.watch("unit_price"));
    const taxPercent = toNum(form.watch("tax_rate") || 18);
    const priceWithTax = useMemo(
        () => unitPrice * (1 + taxPercent / 100),
        [unitPrice, taxPercent]
    );

    // Load categories from backend and normalize
    useEffect(() => {
        let ignore = false;
        async function loadCats() {
            setCatLoading(true);
            try {
                const { data } = await superadmin.getProductCategories();
                const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
                const norm = raw
                    .map((item) => {
                        if (typeof item === "string") return { value: item, label: item };
                        const value = String(item?.code ?? item?.value ?? item?.id ?? item?.name ?? "").trim();
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
        if (open) loadCats();
        return () => {
            ignore = true;
        };
    }, [open]);

    // Load product + batches
    useEffect(() => {
        let ignore = false;
        async function run() {
            if (!open || !id) return;
            setLoading(true);
            try {
                // Rich detail includes batches we can edit
                const { data } = await superadmin.getProductDetail(id);
                const p = data?.data?.product || {};
                const batches = data?.data?.batches || [];

                if (ignore) return;

                // Fill product fields we know; any missing backend fields default safely
                form.reset({
                    name: p.name || "",
                    category: p.category || "",
                    unit_price: p.unit_price != null ? String(p.unit_price) : "",
                    tax_rate: p.tax_rate != null ? String(p.tax_rate) : "",
                    sku: p.sku || "",
                    barcode: p.barcode || "",
                    brand: p.brand || "",
                    unit_of_measure: p.unit_of_measure || "",
                    description: p.description || "",
                    is_active: p.is_active != null ? !!p.is_active : true,
                    remove_image: false,
                    batches: (batches || []).map((b) => ({
                        id: b.id,
                        store_id: b?.store?.id || "",
                        // default to received for edit; you may choose remaining depending on policy
                        quantity: b?.quantities?.received != null ? String(b.quantities.received) : "",
                        expiry_date: b?.dates?.expiry_date || "",
                    })),
                });

                setImageFile(null);
                setServerImage(p.image || null);
                setRemoveImage(false);
            } catch (err) {
                toast.error(err?.message || "Failed to load product.");
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        run();
        return () => {
            ignore = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, id]);

    // Ensure category has a default after categories load
    useEffect(() => {
        if (!catLoading) {
            const current = form.getValues("category");
            const first = categories?.[0]?.value || "";
            if (!current && first) form.setValue("category", first, { shouldValidate: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [catLoading, categories]);

    const canSubmit = form.formState.isValid && !submitting;

    // Build payload: product fields + minimal stock-in changes + image/remove_image
    const buildPayload = (values) => {
        // StockIn payload (only include entries that have at least a quantity or store/expiry change)
        const stockins = (values.batches || [])
            .map((b) => {
                const payload = {};
                if (b.id) payload.id = b.id; // existing batch
                if (b.store_id !== undefined) {
                    // send null when empty string to make it global
                    payload.store_id = b.store_id ? b.store_id : null;
                }
                if (b.quantity !== undefined && b.quantity !== "") payload.quantity = b.quantity;
                if (b.expiry_date !== undefined && b.expiry_date !== "") payload.expiry_date = b.expiry_date;
                // Filter out completely empty new rows
                if (!payload.id && !payload.quantity && payload.store_id == null && !payload.expiry_date) {
                    return null;
                }
                return payload;
            })
            .filter(Boolean);

        const needsMultipart = !!imageFile || !!removeImage;
        if (needsMultipart) {
            const fd = new FormData();
            fd.append("name", values.name);
            fd.append("category", values.category);
            if (values.unit_price !== "") fd.append("unit_price", values.unit_price);
            if (values.tax_rate !== "") fd.append("tax_rate", values.tax_rate);
            if (values.sku) fd.append("sku", values.sku);
            if (values.barcode) fd.append("barcode", values.barcode);
            if (values.brand) fd.append("brand", values.brand);
            if (values.unit_of_measure) fd.append("unit_of_measure", values.unit_of_measure);
            if (values.description) fd.append("description", values.description);
            fd.append("is_active", String(!!values.is_active));
            if (removeImage) fd.append("remove_image", "true");
            if (imageFile) fd.append("image", imageFile);
            if (stockins.length) fd.append("stockins", JSON.stringify(stockins));
            return fd;
        }
        return {
            name: values.name,
            category: values.category,
            ...(values.unit_price !== "" ? { unit_price: values.unit_price } : {}),
            ...(values.tax_rate !== "" ? { tax_rate: values.tax_rate } : {}),
            ...(values.sku ? { sku: values.sku } : {}),
            ...(values.barcode ? { barcode: values.barcode } : {}),
            ...(values.brand ? { brand: values.brand } : {}),
            ...(values.unit_of_measure ? { unit_of_measure: values.unit_of_measure } : {}),
            ...(values.description ? { description: values.description } : {}),
            is_active: !!values.is_active,
            ...(stockins.length ? { stockins } : {}),
        };
    };

    const onSubmit = form.handleSubmit(async (values) => {
        try {
            setSubmitting(true);
            const payload = buildPayload(values);
            const { message } = await superadmin.updateProduct(id, payload);
            toast.success(message || "Product updated successfully.");
            onDone?.();
            onOpenChange?.(false);
        } catch (err) {
            toast.error(err?.message || "Failed to update product.");
        } finally {
            setSubmitting(false);
        }
    });

    // Totals preview across edited batches (simple net/gross using entered quantity)
    const totals = useMemo(() => {
        const arr = form.getValues("batches") || [];
        let totalQty = 0;
        let totalNet = 0;
        let totalGross = 0;
        const pwt = priceWithTax || 0;
        arr.forEach((b) => {
            const q = toNum(b.quantity);
            totalQty += q;
            totalNet += q * unitPrice;
            totalGross += q * pwt;
        });
        return { qty: totalQty, net: totalNet, gross: totalGross };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch("batches"), unitPrice, priceWithTax]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[min(920px,100vw)] sm:max-w-[920px] p-0 border-l bg-white/90 backdrop-blur-xl"
            >
                <div
                    className="h-1.5 w-full"
                    style={{ background: "linear-gradient(90deg, var(--primary-color), #059669)" }}
                />
                <div className="flex h-[calc(100vh-0.375rem)] flex-col">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                        <SheetHeader className="mb-3">
                            <SheetTitle className="flex items-center gap-2">
                                <Save className="h-5 w-5 text-emerald-600" />
                                Update product
                            </SheetTitle>
                            <SheetDescription>Change core details, pricing, image, and batch data.</SheetDescription>
                        </SheetHeader>

                        {loading ? (
                            <div className="grid gap-3">
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <Skeleton className="h-28 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        ) : (
                            <>
                                {/* Product block */}
                                <div className="rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="text-sm font-semibold">Product</div>
                                        <Badge variant="secondary" className="glass-badge">
                                            <Calculator className="mr-1 h-3.5 w-3.5" />
                                            Tax preview @ {taxPercent || 18}%
                                        </Badge>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="grid gap-1.5 sm:col-span-2">
                                            <Label>Name</Label>
                                            <Input placeholder="e.g., Premium Orange Juice 1L" {...form.register("name")} className="border border-neutral-200" />
                                        </div>

                                        {/* Category via shadcn Select (glassy) */}
                                        <div className="grid gap-1.5">
                                            <Label>Category</Label>
                                            <Controller
                                                control={control}
                                                name="category"
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        disabled={catLoading || !categories.length}
                                                    >
                                                        <SelectTrigger className="h-10 w-full rounded-md border border-neutral-200 bg-white/90 px-3 text-sm outline-none transition-[box-shadow] focus:ring-2 focus:ring-emerald-500/30">
                                                            <SelectValue placeholder={catLoading ? "Loading…" : "Select a category"} />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-md border border-neutral-200 bg-white/95 backdrop-blur">
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
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label>Unit price</Label>
                                            <Input type="number" step="0.01" placeholder="0.00" {...form.register("unit_price")} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Tax rate (%)</Label>
                                            <Input type="number" step="0.01" placeholder="18.00" {...form.register("tax_rate")} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Price w/ tax (preview)</Label>
                                            <div className="rounded-xl border border-black/5 bg-white/70 px-3 py-2 text-sm">
                                                {Number.isFinite(priceWithTax) ? priceWithTax.toFixed(2) : "—"}
                                            </div>
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label>SKU (optional)</Label>
                                            <Input placeholder="e.g., POJ-1L-001" {...form.register("sku")} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Barcode (optional)</Label>
                                            <Input placeholder="e.g., 6291041500213" {...form.register("barcode")} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Brand (optional)</Label>
                                            <Input placeholder="e.g., CitrusCo" {...form.register("brand")} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Unit of measure (optional)</Label>
                                            <Input placeholder="e.g., PCS" {...form.register("unit_of_measure")} />
                                        </div>
                                    </div>
                                </div>

                                {/* Status & Image */}
                                <div className="mt-4 rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur">
                                    <div className="mb-3 text-sm font-semibold">Status & Image</div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/60 p-3">
                                            <Controller
                                                control={control}
                                                name="is_active"
                                                render={({ field }) => (
                                                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                                                )}
                                            />
                                            <div className="text-sm">Active</div>
                                        </div>

                                        <div className="grid gap-1.5 md:col-span-2">
                                            <Label>Image</Label>
                                            <ImageDropzone
                                                file={imageFile}
                                                onFileChange={setImageFile}
                                                removeFlag={removeImage}
                                                onToggleRemove={setRemoveImage}
                                                serverImage={serverImage}
                                            />
                                            <p className="text-xs text-neutral-500">
                                                Upload new image, keep current, or remove it. Square image preferred.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Batches (StockIn updates) */}
                                <div className="mt-4 rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="text-sm font-semibold">Stock-in batches</div>
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
                                        {fields.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-black/5 p-4 text-sm text-neutral-500">
                                                No batches added yet. Use “Add batch” to create one.
                                            </div>
                                        ) : (
                                            fields.map((f, idx) => (
                                                <div
                                                    key={f.__key}
                                                    className="rounded-xl border border-black/5 bg-white/60 p-3"
                                                >
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <div className="text-sm font-medium">
                                                            Batch #{idx + 1} {f.id ? <Badge variant="secondary" className="ml-2">Existing</Badge> : <Badge className="ml-2">New</Badge>}
                                                        </div>
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
                                                        <div className="grid gap-1.5 md:col-span-2">
                                                            <Label>Store (optional)</Label>
                                                            <Controller
                                                                control={control}
                                                                name={`batches.${idx}.store_id`}
                                                                render={({ field }) => (
                                                                    <StorePicker value={field.value || ""} onChange={field.onChange} />
                                                                )}
                                                            />
                                                            <p className="text-xs text-neutral-500">
                                                                Leave empty for a global batch (no store).
                                                            </p>
                                                        </div>

                                                        <div className="grid gap-1.5">
                                                            <Label>Quantity</Label>
                                                            <Controller
                                                                control={control}
                                                                name={`batches.${idx}.quantity`}
                                                                render={({ field }) => (
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        {...field}
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="grid gap-1.5">
                                                            <Label>Expiry Date</Label>
                                                            <Controller
                                                                control={control}
                                                                name={`batches.${idx}.expiry_date`}
                                                                render={({ field }) => <Input type="date" {...field} />}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Live calc per row */}
                                                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                                                        <div className="rounded-lg border border-black/5 bg-white/60 p-2">
                                                            <div className="text-xs uppercase text-neutral-500">Value net</div>
                                                            <div className="font-semibold">
                                                                {(() => {
                                                                    const q = toNum(form.getValues(`batches.${idx}.quantity`));
                                                                    return (q * unitPrice || 0).toFixed(2);
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <div className="rounded-lg border border-black/5 bg-white/60 p-2">
                                                            <div className="text-xs uppercase text-neutral-500">Value gross</div>
                                                            <div className="font-semibold">
                                                                {(() => {
                                                                    const q = toNum(form.getValues(`batches.${idx}.quantity`));
                                                                    return (q * priceWithTax || 0).toFixed(2);
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <div className="rounded-lg border border-black/5 bg-white/60 p-2">
                                                            <div className="text-xs uppercase text-neutral-500">Price w/ tax</div>
                                                            <div className="font-semibold">
                                                                {Number.isFinite(priceWithTax) ? priceWithTax.toFixed(2) : "—"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Totals */}
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                                        <div className="rounded-xl border border-black/5 bg-white/70 p-3">
                                            <div className="text-xs uppercase text-neutral-500">Total qty</div>
                                            <div className="text-lg font-semibold">{totals.qty.toFixed(2)}</div>
                                        </div>
                                        <div className="rounded-xl border border-black/5 bg-white/70 p-3">
                                            <div className="text-xs uppercase text-neutral-500">Total net value</div>
                                            <div className="text-lg font-semibold">{totals.net.toFixed(2)}</div>
                                        </div>
                                        <div className="rounded-xl border border-black/5 bg-white/70 p-3">
                                            <div className="text-xs uppercase text-neutral-500">Total gross value</div>
                                            <div className="text-lg font-semibold">{totals.gross.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mt-4 rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur">
                                    <div className="mb-3 text-sm font-semibold">Description</div>
                                    <textarea
                                        rows={4}
                                        placeholder="Optional description…"
                                        className="w-full rounded-xl border border-black/5 bg-white/70 p-3 text-sm outline-none"
                                        {...form.register("description")}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Bottom actions */}
                    <div className="sticky bottom-0 rounded-none border-t border-black/5 bg-white/90 p-3 backdrop-blur-sm">
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => onOpenChange?.(false)}
                                className="cursor-pointer rounded-4xl px-4 py-5"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                disabled={!canSubmit}
                                onClick={onSubmit}
                                className="cursor-pointer text-white rounded-4xl px-4 py-5 glass-cta"
                            >
                                {submitting ? "Saving…" : "Save changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
