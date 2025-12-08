import React, { useEffect, useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";

import { RotateCcw, Search as SearchIcon } from "lucide-react";

import { DEFAULT_PRODUCT_FILTERS } from "./productFiltersConstants";
import { superadmin } from "@/api";

const ALL_CATEGORIES = "__ALL__";
const ALL_STORES = "__ALL_STORES__";
const GLOBAL_STORE = "__GLOBAL__";

const ProductFiltersSheet = ({ value, onChange, open, onOpenChange }) => {
    const [draft, setDraft] = useState(value || DEFAULT_PRODUCT_FILTERS);

    useEffect(() => {
        if (open) setDraft(value);
    }, [open, value]);

    const update = (patch) => {
        setDraft((prev) => ({ ...prev, ...patch }));
    };

    const reset = () => setDraft(DEFAULT_PRODUCT_FILTERS);

    const applyFilters = () => {
        onChange?.(draft);
        onOpenChange(false);
    };

    /* --------------------------- Categories --------------------------- */
    const [categories, setCategories] = useState([]);
    const [catLoading, setCatLoading] = useState(false);

    // New: local search and open state for category dropdown
    const [catQ, setCatQ] = useState("");
    const [catOpen, setCatOpen] = useState(false);

    useEffect(() => {
        async function load() {
            setCatLoading(true);
            try {
                const { data } = await superadmin.getProductCategories();
                const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
                const clean = arr.map((item) => {
                    const v = item?.value || item?.code || item?.id || item?.name || item;
                    const label = item?.label || item?.name || item?.title || v;
                    return { value: String(v), label: String(label) };
                });
                setCategories(clean);
            } catch {
                setCategories([]);
            } finally {
                setCatLoading(false);
            }
        }
        load();
    }, []);

    // Reset search when dropdown closes/open changes
    useEffect(() => {
        if (!catOpen) setCatQ("");
    }, [catOpen]);

    const filteredCategories = useMemo(() => {
        const q = catQ?.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter(
            (c) => c.label.toLowerCase().includes(q) || c.value.toLowerCase().includes(q)
        );
    }, [categories, catQ]);

    /* ------------------------------ Stores ------------------------------ */
    const [stores, setStores] = useState([]);
    const [storeQ, setStoreQ] = useState("");
    const [storeLoading, setStoreLoading] = useState(false);
    const [storeOpen, setStoreOpen] = useState(false);

    useEffect(() => {
        async function load() {
            setStoreLoading(true);
            try {
                const { data } = await superadmin.listStores({ ordering: "name" });
                setStores(data?.results || []);
            } catch {
                setStores([]);
            } finally {
                setStoreLoading(false);
            }
        }
        load();
    }, []);

    useEffect(() => {
        if (!storeOpen) return;
        const timeout = setTimeout(async () => {
            setStoreLoading(true);
            try {
                const params = { ordering: "name" };
                if (storeQ.trim()) params.search = storeQ.trim();
                const { data } = await superadmin.listStores(params);
                setStores(data?.results || []);
            } catch {
                setStores([]);
            } finally {
                setStoreLoading(false);
            }
        }, 350);
        return () => clearTimeout(timeout);
    }, [storeQ, storeOpen]);

    const storeSelectValue = (() => {
        if (draft.store_id) return String(draft.store_id);
        if (draft.has_store === false) return GLOBAL_STORE;
        return ALL_STORES;
    })();

    const onStoreChange = (val) => {
        if (val === ALL_STORES) return update({ store_id: "", has_store: "" });
        if (val === GLOBAL_STORE) return update({ store_id: "", has_store: false });
        update({ store_id: val, has_store: "" });
    };

    /* -------------------------- Active chips -------------------------- */
    const activeChips = Object.entries(draft)
        .filter(([, val]) => val !== "" && val !== null && val !== undefined)
        .map(([key]) => key.replace(/_/g, " "));

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[90%] sm:w-[400px] p-0 flex flex-col bg-white"
            >
                <SheetHeader className="px-5 py-4 border-b border-neutral-200">
                    <SheetTitle className="text-left">Filters</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                    {/* CATEGORY */}
                    <div className="space-y-1">
                        <Label>Category</Label>

                        {/* Premium glass dropdown with scrollable content and search */}
                        <Select
                            value={draft.category || ALL_CATEGORIES}
                            onValueChange={(v) =>
                                update({ category: v === ALL_CATEGORIES ? "" : v })
                            }
                            onOpenChange={(o) => setCatOpen(o)}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90">
                                <SelectValue placeholder="All categories" />
                            </SelectTrigger>

                            {/* Make the select content look premium: glass, blurred, max height with scroll */}
                            <SelectContent className="p-0">
                                {/* Search box inside the dropdown */}
                                <div className="p-3 border-b border-white/20 bg-white/10 backdrop-blur-md">
                                    <div className="relative">
                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                        <Input
                                            value={catQ}
                                            onChange={(e) => setCatQ(e.target.value)}
                                            placeholder="Search categories…"
                                            className="pl-9 h-9 bg-white/5"
                                        />
                                    </div>
                                </div>

                                {/* Scrollable list: fixed max height, nice padding, glass look */}
                                <div
                                    className="max-h-60 overflow-y-auto p-2 space-y-1"
                                    style={{
                                        // fallback in case Tailwind classes aren't present
                                        maxHeight: "15rem",
                                    }}
                                >
                                    <SelectItem value={ALL_CATEGORIES}>
                                        <div className="flex items-center justify-between w-full">
                                            <span>All categories</span>
                                            <span className="text-xs opacity-70">({categories.length})</span>
                                        </div>
                                    </SelectItem>

                                    {!catLoading && filteredCategories.length === 0 && (
                                        <div className="px-3 py-2 text-sm text-neutral-500">No categories found</div>
                                    )}

                                    {!catLoading &&
                                        filteredCategories.map((c) => (
                                            <SelectItem
                                                key={c.value}
                                                value={c.value}
                                                className="rounded-md hover:bg-white/10 p-2"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{c.label}</span>
                                                    <span className="text-xs opacity-60 truncate">
                                                        {c.value}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}

                                    {catLoading && (
                                        <div className="px-3 py-2 text-sm text-neutral-500">Loading…</div>
                                    )}
                                </div>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* STORE */}
                    <div className="space-y-1">
                        <Label>Store</Label>
                        <Select
                            value={storeSelectValue}
                            onValueChange={onStoreChange}
                            onOpenChange={(o) => {
                                setStoreOpen(o);
                                if (!o) setStoreQ("");
                            }}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90">
                                <SelectValue placeholder="All stores" />
                            </SelectTrigger>

                            <SelectContent className="p-0">
                                {/* Search box */}
                                <div className="p-2 border-b border-neutral-200 bg-white">
                                    <div className="relative">
                                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                        <Input
                                            value={storeQ}
                                            onChange={(e) => setStoreQ(e.target.value)}
                                            placeholder="Search store…"
                                            className="pl-8 h-8"
                                        />
                                    </div>
                                </div>

                                <SelectItem value={ALL_STORES}>All stores</SelectItem>
                                <SelectItem value={GLOBAL_STORE}>Global (no store)</SelectItem>

                                {!storeLoading &&
                                    stores.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name}
                                        </SelectItem>
                                    ))}

                                {storeLoading && (
                                    <div className="px-3 py-2 text-sm text-neutral-500">Loading…</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* SWITCHES */}
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <Label>Has store</Label>
                            <Switch
                                checked={!!draft.has_store}
                                onCheckedChange={(v) => update({ has_store: v ? true : "" })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label>Has remaining</Label>
                            <Switch
                                checked={!!draft.has_remaining}
                                onCheckedChange={(v) => update({ has_remaining: v ? true : "" })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label>Include voided</Label>
                            <Switch
                                checked={!!draft.is_void}
                                onCheckedChange={(v) => update({ is_void: v ? true : "" })}
                            />
                        </div>
                    </div>

                    {/* MORE FILTERS */}
                    <div className="grid gap-3">
                        <Label>Price range</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={draft.min_unit_price}
                                onChange={(e) => update({ min_unit_price: e.target.value })}
                            />
                            <Input
                                type="number"
                                placeholder="Max"
                                value={draft.max_unit_price}
                                onChange={(e) => update({ max_unit_price: e.target.value })}
                            />
                        </div>

                        <Label>Expiry range</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                type="date"
                                value={draft.expiring_after}
                                onChange={(e) => update({ expiring_after: e.target.value })}
                            />
                            <Input
                                type="date"
                                value={draft.expiring_before}
                                onChange={(e) => update({ expiring_before: e.target.value })}
                            />
                        </div>

                        <Label>Created range</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                type="datetime-local"
                                value={draft.created_after}
                                onChange={(e) => update({ created_after: e.target.value })}
                            />
                            <Input
                                type="datetime-local"
                                value={draft.created_before}
                                onChange={(e) => update({ created_before: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Active chips */}
                    {activeChips.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {activeChips.map((c) => (
                                <Badge key={c} variant="secondary" className="glass-badge">
                                    {c}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <SheetFooter className="px-5 py-4 border-t border-neutral-200 bg-white">
                    <div className="flex items-center justify-between w-full gap-2">
                        <Button
                            variant="ghost"
                            onClick={reset}
                            className="rounded-4xl px-4 py-5 text-neutral-700 hover:bg-neutral-100"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>

                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => onOpenChange(false)}
                                className="rounded-4xl px-4 py-5"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={applyFilters}
                                className="glass-cta rounded-4xl px-4 py-5"
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default ProductFiltersSheet;
