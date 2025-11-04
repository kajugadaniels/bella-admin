import React, { useEffect, useMemo, useState, memo } from "react";
import { SlidersHorizontal, Search as SearchIcon } from "lucide-react";

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
import { DEFAULT_PRODUCT_FILTERS } from "./productFiltersConstants";

// Non-empty sentinels for Radix Select
const ALL_CATEGORIES_VALUE = "__ALL__";
const ALL_STORES_VALUE = "__ALL_STORES__";
const GLOBAL_STORE_VALUE = "__GLOBAL__";

function ProductFiltersBase({ value, onChange, className }) {
    const [moreOpen, setMoreOpen] = useState(false);
    const v = value || DEFAULT_PRODUCT_FILTERS;

    const set = (patch) => onChange?.({ ...v, ...patch });
    const reset = () => onChange?.({ ...DEFAULT_PRODUCT_FILTERS });

    /* ------------------------------ Stores (async) ------------------------------ */
    const [storeOpen, setStoreOpen] = useState(false);
    const [storeLoading, setStoreLoading] = useState(false);
    const [stores, setStores] = useState([]);
    const [storeQ, setStoreQ] = useState("");

    // Initial list on mount
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
        return () => { ignore = true; };
    }, []);

    // Live search when Select is open
    useEffect(() => {
        if (!storeOpen) return;
        let ignore = false;
        const id = setTimeout(async () => {
            setStoreLoading(true);
            try {
                const params = { ordering: "name" };
                if (storeQ.trim()) params.search = storeQ.trim();
                const { data } = await superadmin.listStores(params);
                if (!ignore) setStores(data?.results || []);
            } catch {
                if (!ignore) setStores([]);
            } finally {
                if (!ignore) setStoreLoading(false);
            }
        }, 350);
        return () => { clearTimeout(id); ignore = true; };
    }, [storeQ, storeOpen]);

    // Derive Select value for store using sentinels
    const storeSelectValue = (() => {
        if (v.store_id) return String(v.store_id);
        if (v.has_store === false) return GLOBAL_STORE_VALUE;      // "Global (no store)"
        return ALL_STORES_VALUE;                                   // "All stores"
    })();

    const onStoreValueChange = (val) => {
        if (val === ALL_STORES_VALUE) {
            set({ store_id: "", has_store: "" });
            return;
        }
        if (val === GLOBAL_STORE_VALUE) {
            set({ store_id: "", has_store: false });
            return;
        }
        set({ store_id: val, has_store: "" });
    };

    /* ------------------------------ Categories (async) ------------------------------ */
    const [catLoading, setCatLoading] = useState(false);
    const [categories, setCategories] = useState(
    /** @type {Array<{value:string; label:string}>} */([])
    );

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

    /* ------------------------------ Active chips ------------------------------ */
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
            .filter(([, val]) => val !== "" && val !== null && val !== undefined)
            .map(([k]) => labels[k] || k.replaceAll("_", " "));
    }, [v]);

    return (
        <div
            className={[
                "rounded-2xl border border-neutral-200 bg-white/70 p-3 backdrop-blur-md",
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
                        value={(v.category && String(v.category)) || ALL_CATEGORIES_VALUE}
                        onValueChange={(val) => set({ category: val === ALL_CATEGORIES_VALUE ? "" : val })}
                        disabled={catLoading}
                    >
                        <SelectTrigger
                            id="pf-category"
                            className="h-9 w-full rounded-xl border border-neutral-200 bg-white/90 px-3 text-sm outline-none transition-[box-shadow] focus:ring-2 focus:ring-emerald-500/30"
                        >
                            <SelectValue placeholder={catLoading ? "Loading…" : "All categories"} />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            sideOffset={6}
                            className="max-h-64 overflow-y-auto rounded-xl border border-neutral-200 bg-white/95 backdrop-blur scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1"
                        >
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

                {/* Store (shadcn Select with live search) */}
                <div className="grid min-w-[240px] flex-1 gap-1.5">
                    <Label htmlFor="pf-store" className="text-xs text-neutral-500">
                        Store
                    </Label>
                    <Select
                        value={storeSelectValue}
                        onValueChange={onStoreValueChange}
                        onOpenChange={(o) => {
                            setStoreOpen(o);
                            if (!o) setStoreQ("");
                        }}
                        disabled={storeLoading && !storeOpen}
                    >
                        <SelectTrigger
                            id="pf-store"
                            className="h-9 w-full rounded-xl border border-neutral-200 bg-white/90 px-3 text-sm outline-none transition-[box-shadow] focus:ring-2 focus:ring-emerald-500/30"
                        >
                            <SelectValue placeholder={storeLoading ? "Loading…" : "All stores"} />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            sideOffset={6}
                            className="w-[var(--radix-select-trigger-width)] max-h-72 overflow-y-auto rounded-xl border border-neutral-200 bg-white/95 p-0 backdrop-blur"
                        >
                            {/* Inline search input inside the Select popover */}
                            <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 p-2 backdrop-blur">
                                <div className="relative">
                                    <SearchIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                    <Input
                                        placeholder="Search store…"
                                        value={storeQ}
                                        onChange={(e) => setStoreQ(e.target.value)}
                                        className="h-8 w-full rounded-lg pl-8"
                                    />
                                </div>
                            </div>

                            {/* Static options */}
                            <SelectItem value={ALL_STORES_VALUE}>All stores</SelectItem>
                            <SelectItem value={GLOBAL_STORE_VALUE}>Global (no store)</SelectItem>

                            {/* Dynamic options */}
                            <div className="px-1 py-1">
                                {storeLoading && (
                                    <div className="px-2 py-1 text-xs text-neutral-500">Loading…</div>
                                )}
                                {!storeLoading && (!stores || stores.length === 0) && (
                                    <div className="px-2 py-1 text-xs text-neutral-500">No stores found.</div>
                                )}
                                {!storeLoading &&
                                    (stores || []).map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                            </div>
                        </SelectContent>
                    </Select>
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

                    <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
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