import React, { useEffect, useMemo, useState, memo } from "react";
import { SlidersHorizontal } from "lucide-react";

import { superadmin } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

/** Exported so the parent can share the same defaults */
export const DEFAULT_PRODUCT_FILTERS = {
    category: "",
    store_id: "",
    has_store: "",
    has_remaining: "",
    is_void: "",
    min_unit_price: "",
    max_unit_price: "",
    expiring_after: "",
    expiring_before: "",
    created_after: "",
    created_before: "",
};

// Non-empty sentinel used for "All categories"
const ALL_CATEGORIES_VALUE = "__ALL__";

function ProductFiltersBase({ value, onChange, className }) {
    const [open, setOpen] = useState(false);
    const v = value || DEFAULT_PRODUCT_FILTERS;

    const set = (patch) => onChange?.({ ...v, ...patch });
    const reset = () => onChange?.({ ...DEFAULT_PRODUCT_FILTERS });

    // Stores for the Store select
    const [storeLoading, setStoreLoading] = useState(false);
    const [stores, setStores] = useState([]);

    // Categories (fetched from backend)
    const [catLoading, setCatLoading] = useState(false);
    /** @type {[Array<{value:string; label:string}>, Function]} */
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        let ignore = false;
        async function run() {
            setStoreLoading(true);
            try {
                const params = { ordering: "name" };
                const { data } = await superadmin.listStores(params);
                if (!ignore) setStores(data?.results || []);
            } catch {
                if (!ignore) setStores([]);
            } finally {
                if (!ignore) setStoreLoading(false);
            }
        }
        run();
        return () => {
            ignore = true;
        };
    }, []);

    // Load categories from backend (enum list)
    useEffect(() => {
        let ignore = false;
        async function load() {
            setCatLoading(true);
            try {
                const { data } = await superadmin.getProductCategories();
                const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
                const norm = raw
                    .map((item) => {
                        if (typeof item === "string") return { value: item, label: item };
                        const value = String(item?.code ?? item?.value ?? item?.id ?? item?.name ?? "").trim();
                        const label = String(item?.label ?? item?.name ?? item?.title ?? item?.code ?? item?.value ?? value).trim();
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

    // When a store is chosen, push store_id and clear has_store to avoid competing filters.
    const handleStoreChange = (e) => {
        const val = e.target.value;
        if (val === "__GLOBAL__") {
            set({ store_id: "", has_store: false });
            return;
        }
        if (!val) {
            set({ store_id: "", has_store: "" });
            return;
        }
        set({ store_id: val, has_store: "" });
    };

    // Active filter chips
    const activeChips = useMemo(() => {
        const labels = {
            category: "category",
            store_id: "store",
            has_store: "has store",
            has_remaining: "has remaining",
            is_void: "include voided",
            min_unit_price: "min price",
            max_unit_price: "max price",
            expiring_after: "exp ≥",
            expiring_before: "exp ≤",
            created_after: "created ≥",
            created_before: "created ≤",
        };
        return Object.entries(v)
            .filter(([_, val]) => val !== "" && val !== null && val !== undefined)
            .map(([k]) => labels[k] || k.replaceAll("_", " "));
    }, [v]);

    return (
        <div
            className={[
                "rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur-md",
                "dark:border-white/10 dark:bg-neutral-900/60",
                className || "",
            ].join(" ")}
        >
            <div className="flex flex-wrap items-center gap-3">
                {/* Category (Select from backend) */}
                <div className="grid min-w-[220px] flex-1 gap-1.5">
                    <Label htmlFor="pf-category" className="text-xs text-neutral-500">
                        Category
                    </Label>
                    <Select
                        // Use sentinel when empty to avoid Radix empty-string constraint
                        value={(v.category && String(v.category)) || ALL_CATEGORIES_VALUE}
                        onValueChange={(val) => set({ category: val === ALL_CATEGORIES_VALUE ? "" : val })}
                        disabled={catLoading}
                    >
                        <SelectTrigger
                            id="pf-category"
                            className="h-9 w-full rounded-xl border border-black/5 bg-white/90 px-3 text-sm outline-none transition-[box-shadow] focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-neutral-900 cursor-pointer"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            sideOffset={6}
                            className="max-h-64 overflow-y-auto rounded-xl border border-black/5 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-neutral-900/95 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent dark:scrollbar-thumb-neutral-700 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1"
                        >
                            {/* “All categories” option uses non-empty sentinel */}
                            <SelectItem value={ALL_CATEGORIES_VALUE}>All categories</SelectItem>

                            {catLoading ? (
                                <div className="p-2 text-sm text-neutral-500">Loading…</div>
                            ) : categories.length ? (
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
                </div>

                {/* Store (native select) */}
                <div className="grid min-w-[240px] flex-1 gap-1.5">
                    <Label htmlFor="pf-store" className="text-xs text-neutral-500">
                        Store
                    </Label>
                    <select
                        id="pf-store"
                        value={v.store_id || ""}
                        onChange={handleStoreChange}
                        disabled={storeLoading}
                        className={[
                            "h-9 w-full rounded-xl border px-3 text-sm",
                            "border-black/5 bg-white text-neutral-900",
                            "dark:border-white/10 dark:bg-white dark:text-neutral-900",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        ].join(" ")}
                    >
                        <option value="">{storeLoading ? "Loading…" : "All stores"}</option>
                        <option value="__GLOBAL__">Global (no store)</option>
                        {stores.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Toggles */}
                <div className="grid gap-1.5">
                    <Label className="text-xs text-neutral-500">Has store</Label>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={!!v.has_store}
                            onCheckedChange={(c) => set({ has_store: c ? true : "" })}
                        />
                        <span className="text-sm">Only with store</span>
                    </div>
                </div>

                <div className="grid gap-1.5">
                    <Label className="text-xs text-neutral-500">Has remaining</Label>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={!!v.has_remaining}
                            onCheckedChange={(c) => set({ has_remaining: c ? true : "" })}
                        />
                        <span className="text-sm">Remaining &gt; 0</span>
                    </div>
                </div>

                <div className="grid gap-1.5">
                    <Label className="text-xs text-neutral-500">Voided</Label>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={!!v.is_void}
                            onCheckedChange={(c) => set({ is_void: c ? true : "" })}
                        />
                        <span className="text-sm">Include voided</span>
                    </div>
                </div>

                {/* More filters + Reset */}
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={reset}
                        className="glass-button cursor-pointer"
                    >
                        Reset
                    </Button>

                    <DropdownMenu open={open} onOpenChange={setOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="glass-button cursor-pointer"
                            >
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                More filters
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-menu w-80 p-3">
                            <div className="grid gap-3">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Min unit price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={v.min_unit_price ?? ""}
                                        onChange={(e) => set({ min_unit_price: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Max unit price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={v.max_unit_price ?? ""}
                                        onChange={(e) => set({ max_unit_price: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs">Expiring after</Label>
                                        <Input
                                            type="date"
                                            value={v.expiring_after || ""}
                                            onChange={(e) => set({ expiring_after: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs">Expiring before</Label>
                                        <Input
                                            type="date"
                                            value={v.expiring_before || ""}
                                            onChange={(e) => set({ expiring_before: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs">Created after</Label>
                                        <Input
                                            type="datetime-local"
                                            value={v.created_after || ""}
                                            onChange={(e) => set({ created_after: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs">Created before</Label>
                                        <Input
                                            type="datetime-local"
                                            value={v.created_before || ""}
                                            onChange={(e) => set({ created_before: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Active filters summary */}
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {activeChips.map((label) => (
                                        <Badge key={label} variant="secondary" className="glass-badge">
                                            {label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}

const ProductFilters = memo(ProductFiltersBase);
export default ProductFilters;
