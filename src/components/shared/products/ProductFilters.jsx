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
    is_void: "",
    min_unit_price: "",
    max_unit_price: "",
    expiring_after: "",
    expiring_before: "",
    created_after: "",
    created_before: "",
};

// Non-empty sentinel values for Radix Select items
const CAT_CLEAR = "__ALL_CATEGORIES__";
const STORE_ALL = "__ALL_STORES__";
const STORE_GLOBAL = "__GLOBAL__";

function ProductFiltersBase({ value, onChange, className }) {
    const [open, setOpen] = useState(false);
    const v = value || DEFAULT_PRODUCT_FILTERS;

    const set = (patch) => onChange?.({ ...v, ...patch });
    const reset = () => onChange?.({ ...DEFAULT_PRODUCT_FILTERS });

    /* ----------------------------- backend categories ---------------------------- */
    const [catLoading, setCatLoading] = useState(false);
    const [categories, setCategories] = useState([]); // [{value, label}]

    useEffect(() => {
        let ignore = false;
        async function run() {
            setCatLoading(true);
            try {
                const { data } = await superadmin.listCategories();
                const raw = Array.isArray(data?.results) ? data.results : data || [];
                // Normalize -> {value, label}
                const opts = raw
                    .map((c) => {
                        const value = String(c.value ?? c.code ?? "").trim();
                        const label = String(c.label ?? c.name ?? value).trim();
                        return value ? { value, label } : null;
                    })
                    .filter(Boolean);
                if (!ignore) setCategories(opts);
            } catch {
                if (!ignore) setCategories([]);
            } finally {
                if (!ignore) setCatLoading(false);
            }
        }
        run();
        return () => {
            ignore = true;
        };
    }, []);

    /* --------------------------------- stores --------------------------------- */
    const [storeLoading, setStoreLoading] = useState(false);
    const [stores, setStores] = useState([]); // [{id,name}]

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

    // Reflect current filter state in the Store Select (value can be empty to show placeholder)
    const storeSelectValue = useMemo(() => {
        if (v.store_id) return String(v.store_id); // specific store
        if (v.has_store === false) return STORE_GLOBAL; // explicitly no-store
        return ""; // all stores (placeholder)
    }, [v.store_id, v.has_store]);

    const onStoreSelect = (val) => {
        if (val === STORE_ALL) return set({ store_id: "", has_store: "" });
        if (val === STORE_GLOBAL) return set({ store_id: "", has_store: false });
        return set({ store_id: val, has_store: "" });
    };

    /* -------------------------- active filter chips (UX) ------------------------- */
    const activeChips = useMemo(() => {
        const labels = [];

        // Category label
        if (v.category) {
            const cat = categories.find((c) => c.value === v.category);
            labels.push(cat?.label || "category");
        }

        // Store label
        if (v.store_id) {
            const s = stores.find((x) => String(x.id) === String(v.store_id));
            labels.push(s?.name || "store");
        } else if (v.has_store === false) {
            labels.push("Global (no store)");
        } else if (v.has_store === true) {
            labels.push("Has store");
        }

        if (v.is_void !== "") labels.push("include voided");
        if (v.min_unit_price !== "") labels.push(`min price`);
        if (v.max_unit_price !== "") labels.push(`max price`);
        if (v.expiring_after) labels.push("exp ≥");
        if (v.expiring_before) labels.push("exp ≤");
        if (v.created_after) labels.push("created ≥");
        if (v.created_before) labels.push("created ≤");

        return labels;
    }, [v, categories, stores]);

    return (
        <div
            className={[
                "rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur-md",
                "dark:border-white/10 dark:bg-neutral-900/60",
                className || "",
            ].join(" ")}
        >
            <div className="flex flex-wrap items-center gap-3">
                {/* Category (shadcn Select) */}
                <div className="grid min-w-[220px] flex-1 gap-1.5">
                    <Label htmlFor="pf-category" className="text-xs text-neutral-500">
                        Category
                    </Label>
                    <Select
                        value={v.category || ""} // empty -> shows placeholder
                        onValueChange={(val) =>
                            set({ category: val === CAT_CLEAR ? "" : val })
                        }
                        disabled={catLoading}
                    >
                        <SelectTrigger
                            id="pf-category"
                            className="h-9 w-full rounded-xl border border-black/5 bg-white/90 px-3 text-sm outline-none transition-[box-shadow] focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-neutral-900"
                        >
                            <SelectValue placeholder={catLoading ? "Loading…" : "All categories"} />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            sideOffset={6}
                            className="
                max-h-64 overflow-y-auto
                rounded-xl border border-black/5 bg-white/95 backdrop-blur
                dark:border-white/10 dark:bg-neutral-900/95
                scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent
                dark:scrollbar-thumb-neutral-700
                data-[state=open]:animate-in data-[state=closed]:animate-out
                data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
                data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1
              "
                        >
                            {/* Non-empty sentinel to clear category */}
                            <SelectItem key={CAT_CLEAR} value={CAT_CLEAR}>
                                All categories
                            </SelectItem>
                            {categories.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Store (shadcn Select) */}
                <div className="grid min-w-[240px] flex-1 gap-1.5">
                    <Label htmlFor="pf-store" className="text-xs text-neutral-500">
                        Store
                    </Label>
                    <Select
                        value={storeSelectValue} // "" -> placeholder
                        onValueChange={onStoreSelect}
                        disabled={storeLoading}
                    >
                        <SelectTrigger
                            id="pf-store"
                            className="h-9 w-full rounded-xl border border-black/5 bg-white/90 px-3 text-sm outline-none transition-[box-shadow] focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-neutral-900"
                        >
                            <SelectValue placeholder={storeLoading ? "Loading…" : "All stores"} />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            sideOffset={6}
                            className="
                max-h-64 overflow-y-auto
                rounded-xl border border-black/5 bg-white/95 backdrop-blur
                dark:border-white/10 dark:bg-neutral-900/95
                scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent
                dark:scrollbar-thumb-neutral-700
                data-[state=open]:animate-in data-[state=closed]:animate-out
                data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
                data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1
              "
                        >
                            {/* Non-empty sentinel to clear to "all" */}
                            <SelectItem key={STORE_ALL} value={STORE_ALL}>
                                All stores
                            </SelectItem>
                            <SelectItem key={STORE_GLOBAL} value={STORE_GLOBAL}>
                                Global (no store)
                            </SelectItem>
                            {stores.map((s) => (
                                <SelectItem key={String(s.id)} value={String(s.id)}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Has store toggle */}
                <div className="grid gap-1.5">
                    <Label className="text-xs text-neutral-500">Has store</Label>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={!!v.has_store}
                            onCheckedChange={(c) =>
                                // Toggling this clears store_id to avoid conflicts
                                set({ has_store: c ? true : "", store_id: "" })
                            }
                        />
                        <span className="text-sm">Only with store</span>
                    </div>
                </div>

                {/* Voided toggle */}
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
                                    {activeChips.map((label, idx) => (
                                        <Badge key={`${label}-${idx}`} variant="secondary" className="glass-badge">
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
