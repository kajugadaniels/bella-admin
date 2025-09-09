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
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

/** Exported so the parent can share the same defaults */
export const DEFAULT_PRODUCT_FILTERS = {
    category: "",
    store_id: "",            // <-- added for store select
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

function ProductFiltersBase({ value, onChange, className }) {
    const [open, setOpen] = useState(false);
    const v = value || DEFAULT_PRODUCT_FILTERS;

    const set = (patch) => onChange?.({ ...v, ...patch });
    const reset = () => onChange?.({ ...DEFAULT_PRODUCT_FILTERS });

    // ---------- Dynamic Categories (from backend) ----------
    const [catLoading, setCatLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        let ignore = false;
        (async () => {
            setCatLoading(true);
            try {
                const { data } = await superadmin.getProductCategories();
                // Be liberal about response shape
                const list =
                    Array.isArray(data) ? data
                        : Array.isArray(data?.results) ? data.results
                            : Array.isArray(data?.categories) ? data.categories
                                : [];
                if (!ignore) setCategories(list.filter(Boolean));
            } catch {
                if (!ignore) setCategories([]);
            } finally {
                if (!ignore) setCatLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, []);

    // ---------- Stores for the Store select ----------
    const [storeLoading, setStoreLoading] = useState(false);
    const [stores, setStores] = useState([]);

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

    // When a store is chosen, we push store_id. We also clear has_store to avoid redundant/competing filters.
    const handleStoreChange = (e) => {
        const val = e.target.value;
        if (val === "__GLOBAL__") {
            // Special convenience: show batches without a store
            set({ store_id: "", has_store: false });
            return;
        }
        if (!val) {
            // All stores (no filter)
            set({ store_id: "", has_store: "" });
            return;
        }
        set({ store_id: val, has_store: "" });
    };

    // Nice labels for the active filter summary
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
                {/* Category (shadcn Select, dynamic from backend) */}
                <div className="grid min-w-[220px] flex-1 gap-1.5">
                    <Label htmlFor="pf-category" className="text-xs text-neutral-500">
                        Category
                    </Label>
                    <Select
                        value={v.category ?? ""}
                        onValueChange={(val) => set({ category: val })}
                        disabled={catLoading}
                    >
                        <SelectTrigger id="pf-category" className="rounded-xl">
                            <SelectValue placeholder={catLoading ? "Loading categories…" : "All categories"} />
                        </SelectTrigger>
                        <SelectContent className="glass-menu">
                            <SelectItem value="">All categories</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Store (native select retained) */}
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
                        {/* Convenience: batches with no store */}
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

                {/* More filters + Reset (dropdown closed by default) */}
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
