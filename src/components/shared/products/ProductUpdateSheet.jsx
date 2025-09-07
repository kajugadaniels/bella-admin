import React, { useEffect, useMemo, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calculator, ImageIcon, Save, XCircle } from "lucide-react";

/* ---------------------------------- schema --------------------------------- */
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
    // image handled outside zod via file input
});

const CATEGORIES = [
    "DRINKS",
    "DAIRY",
    "BAKERY",
    "MEAT",
    "FRUITS",
    "FROZEN",
    "SNACKS",
    "CLEANING",
    "PERSONAL_CARE",
];

/* --------------------------------- helpers --------------------------------- */
function toNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

/* --------------------------------- component -------------------------------- */
export default function ProductUpdateSheet({ id, open, onOpenChange, onDone }) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState(null);

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
        },
        mode: "onChange",
    });

    const unitPrice = toNum(form.watch("unit_price"), undefined);
    const taxPercent = toNum(form.watch("tax_rate"), 18);
    const priceWithTax = useMemo(() => {
        const price = toNum(unitPrice, 0);
        const tax = toNum(taxPercent, 18);
        return price * (1 + tax / 100);
    }, [unitPrice, taxPercent]);

    useEffect(() => {
        let ignore = false;
        async function run() {
            if (!open || !id) return;
            setLoading(true);
            try {
                const { data } = await superadmin.getProductDetail(id); // expects { data: { product, ... } }
                const p = data?.data?.product || {};
                if (ignore) return;
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
                });
                setImageFile(null);
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

    const canSubmit = form.formState.isValid && !submitting;

    const buildPayload = (values) => {
        // If an image file is selected OR remove_image is true, use multipart/form-data (FormData)
        const needsMultipart = !!imageFile || !!values.remove_image;
        if (needsMultipart) {
            const fd = new FormData();
            if (values.name) fd.append("name", values.name);
            if (values.category) fd.append("category", values.category);
            if (values.unit_price !== "") fd.append("unit_price", values.unit_price);
            if (values.tax_rate !== "") fd.append("tax_rate", values.tax_rate); // percent
            if (values.sku) fd.append("sku", values.sku);
            if (values.barcode) fd.append("barcode", values.barcode);
            if (values.brand) fd.append("brand", values.brand);
            if (values.unit_of_measure) fd.append("unit_of_measure", values.unit_of_measure);
            if (values.description) fd.append("description", values.description);
            fd.append("is_active", String(!!values.is_active));
            if (values.remove_image) fd.append("remove_image", "true");
            if (imageFile) fd.append("image", imageFile);
            return fd;
        }

        // JSON
        const payload = {
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
        };
        return payload;
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
                            <Save className="h-5 w-5 text-emerald-600" />
                            Update product
                        </SheetTitle>
                        <SheetDescription>Change core details, pricing, and image.</SheetDescription>
                    </SheetHeader>

                    {loading ? (
                        <div className="grid gap-3">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-28 w-full rounded-xl" />
                        </div>
                    ) : (
                        <>
                            {/* Product block */}
                            <div className="rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
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
                                        <Input placeholder="e.g., Premium Orange Juice 1L" {...form.register("name")} />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label>Category</Label>
                                        <select
                                            className={[
                                                "h-9 w-full rounded-xl border px-3 text-sm",
                                                "border-black/5 bg-white text-neutral-900",
                                                "dark:border-white/10 dark:bg-white dark:text-neutral-900",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                            ].join(" ")}
                                            {...form.register("category")}
                                        >
                                            <option value="">Select category</option>
                                            {CATEGORIES.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
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
                                        <div className="rounded-xl border border-black/5 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900/60">
                                            {Number.isFinite(priceWithTax) ? priceWithTax.toFixed(2) : "—"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Extra fields */}
                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                <div className="rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
                                    <div className="mb-3 text-sm font-semibold">Identifiers</div>
                                    <div className="grid gap-3">
                                        <div className="grid gap-1.5">
                                            <Label>SKU</Label>
                                            <Input placeholder="POJ-1L-001" {...form.register("sku")} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Barcode</Label>
                                            <Input placeholder="6291041500213" {...form.register("barcode")} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-1.5">
                                                <Label>Brand</Label>
                                                <Input placeholder="CitrusCo" {...form.register("brand")} />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label>Unit of measure</Label>
                                                <Input placeholder="PCS" {...form.register("unit_of_measure")} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
                                    <div className="mb-3 text-sm font-semibold">Status & Image</div>
                                    <div className="grid gap-3">
                                        <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/60 p-3 dark:border-white/10 dark:bg-neutral-900/40">
                                            <Controller
                                                control={form.control}
                                                name="is_active"
                                                render={({ field }) => (
                                                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                                                )}
                                            />
                                            <div className="text-sm">Active</div>
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label className="flex items-center gap-2">
                                                <ImageIcon className="h-4 w-4" />
                                                Image (optional)
                                            </Label>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                            />
                                            <p className="text-xs text-neutral-500">
                                                Upload to replace. Square image preferred. Processed server-side.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/60 p-3 dark:border-white/10 dark:bg-neutral-900/40">
                                            <Controller
                                                control={form.control}
                                                name="remove_image"
                                                render={({ field }) => (
                                                    <Switch
                                                        checked={!!field.value}
                                                        onCheckedChange={(v) => {
                                                            if (imageFile && v) {
                                                                toast.message("Note", { description: "Remove image is ignored if a new image is uploaded." });
                                                            }
                                                            field.onChange(v);
                                                        }}
                                                    />
                                                )}
                                            />
                                            <div className="text-sm">Remove current image</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mt-4 rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
                                <div className="mb-3 text-sm font-semibold">Description</div>
                                <textarea
                                    rows={4}
                                    placeholder="Optional description…"
                                    className="w-full rounded-xl border border-black/5 bg-white/70 p-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-neutral-900/50"
                                    {...form.register("description")}
                                />
                            </div>

                            {/* Bottom actions */}
                            <div className="sticky bottom-0 mt-4 rounded-xl border border-black/5 bg-white/90 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/70">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => onOpenChange?.(false)}
                                        className="cursor-pointer"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={!canSubmit}
                                        onClick={onSubmit}
                                        className="cursor-pointer text-white"
                                    >
                                        {submitting ? "Saving…" : "Save changes"}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
