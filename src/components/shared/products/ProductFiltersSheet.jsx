import React, { useEffect, useState, useMemo } from "react";
import { RotateCcw, Search as SearchIcon } from "lucide-react";

import { superadmin } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
} from "@/components/ui/sheet";

import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

import { DEFAULT_PRODUCT_FILTERS } from "./productFiltersConstants";

const ALL_CATEGORIES_VALUE = "__ALL__";
const ALL_STORES_VALUE = "__ALL_STORES__";
const GLOBAL_STORE_VALUE = "__GLOBAL__";

const ProductFiltersSheet = ({ value, onChange, open, onOpenChange }) => {
    const v = value || DEFAULT_PRODUCT_FILTERS;

    // Draft filters (only commit on Apply)
    const [draft, setDraft] = useState(v);

    useEffect(() => {
        if (open) setDraft(v);
    }, [open]);

    const update = (patch) =>
        setDraft((prev) => ({ ...prev, ...patch }));

    const resetFilters = () => setDraft(DEFAULT_PRODUCT_FILTERS);

    const applyFilters = () => {
        onChange?.(draft);
        onOpenChange(false);
    };

    /* ------------------------------ Categories ------------------------------ */
    const [catLoading, setCatLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        let ignore = false;
        async function load() {
            setCatLoading(true);
            try {
                const { data } = await superadmin.getProductCategories();
                const raw = Array.isArray(data?.data) ? data.data : data || [];
                const list = raw.map((item) =>
                    typeof item === "string"
                        ? { value: item, label: item }
                        : {
                              value: String(item?.code ?? item?.value ?? item?.id ?? "").trim(),
                              label: String(item?.label ?? item?.name ?? item?.title ?? "").trim(),
                          }
                );
                if (!ignore) setCategories(list.filter((x) => x.value));
            } catch {
                if (!ignore) setCategories([]);
            } finally {
                if (!ignore) setCatLoading(false);
            }
        }
        load();
        return () => { ignore = true; };
    }, []);

    /* ------------------------------ Stores w/ live search ------------------------------ */
    const [storeOpen, setStoreOpen] = useState(false);
    const [stores, setStores] = useState([]);
    const [storeQ, setStoreQ] = useState("");
    const [storeLoading, setStoreLoading] = useState(false);

    useEffect(() => {
        let ignore = false;
        async function load() {
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
        }

        if (storeOpen) {
            const id = setTimeout(load, 300);
            return () => { clearTimeout(id); ignore = true; };
        }
    }, [storeOpen, storeQ]);

    const storeSelectValue = (() => {
        if (draft.store_id) return String(draft.store_id);
        if (draft.has_store === false) return GLOBAL_STORE_VALUE;
        return ALL_STORES_VALUE;
    })();

    const updateStore = (val) => {
        if (val === ALL_STORES_VALUE) {
            update({ store_id: "", has_store: "" });
        } else if (val === GLOBAL_STORE_VALUE) {
            update({ store_id: "", has_store: false });
        } else {
            update({ store_id: val, has_store: "" });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[90%] sm:w-[400px] p-0 flex flex-col bg-white"
            >
                <SheetHeader className="px-5 py-4 border-b border-neutral-200">
                    <SheetTitle className="text-left">Filters</SheetTitle>
                </SheetHeader>

                {/* Scroll content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

                    {/* CATEGORY */}
                    <div className="space-y-1">
                        <Label>Category</Label>
                        <Select
                            value={draft.category || ALL_CATEGORIES_VALUE}
                            onValueChange={(val) => update({ category: val === ALL_CATEGORIES_VALUE ? "" : val })}
                            disabled={catLoading}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90 backdrop-blur-sm">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_CATEGORIES_VALUE}>All categories</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem value={c.value} key={c.value}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* STORE */}
                    <div className="space-y-1">
                        <Label>Store</Label>
                        <Select
                            value={storeSelectValue}
                            onValueChange={updateStore}
                            onOpenChange={(o) => {
                                setStoreOpen(o);
                                if (!o) setStoreQ("");
                            }}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90 backdrop-blur-sm">
                                <SelectValue placeholder="Store" />
                            </SelectTrigger>
                            <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                <div className="sticky top-0 bg-white/95 p-2 border-b border-neutral-200">
                                    <div className="relative">
                                        <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                        <Input
                                            className="h-8 pl-8"
                                            placeholder="Search store…"
                                            value={storeQ}
                                            onChange={(e) => setStoreQ(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <SelectItem value={ALL_STORES_VALUE}>All stores</SelectItem>
                                <SelectItem value={GLOBAL_STORE_VALUE}>Global (no store)</SelectItem>

                                {storeLoading && (
                                    <div className="p-2 text-xs text-neutral-500">Loading…</div>
                                )}

                                {!storeLoading && stores.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}

                                {!storeLoading && stores.length === 0 && (
                                    <div className="p-2 text-xs text-neutral-500">No stores</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* TOGGLES */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Switch checked={!!draft.has_store} onCheckedChange={(c) => update({ has_store: c ? true : "" })} />
                            <span className="text-sm">Only products with store</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch checked={!!draft.has_remaining} onCheckedChange={(c) => update({ has_remaining: c ? true : "" })} />
                            <span className="text-sm">Remaining &gt; 0</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch checked={!!draft.is_void} onCheckedChange={(c) => update({ is_void: c ? true : "" })} />
                            <span className="text-sm">Include voided</span>
                        </div>
                    </div>

                    {/* PRICE RANGE */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Min price</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={draft.min_unit_price ?? ""}
                                onChange={(e) => update({ min_unit_price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Max price</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={draft.max_unit_price ?? ""}
                                onChange={(e) => update({ max_unit_price: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* EXPIRY */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Expiring after</Label>
                            <Input
                                type="date"
                                value={draft.expiring_after || ""}
                                onChange={(e) => update({ expiring_after: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Expiring before</Label>
                            <Input
                                type="date"
                                value={draft.expiring_before || ""}
                                onChange={(e) => update({ expiring_before: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* CREATED */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Created after</Label>
                            <Input
                                type="datetime-local"
                                value={draft.created_after || ""}
                                onChange={(e) => update({ created_after: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Created before</Label>
                            <Input
                                type="datetime-local"
                                value={draft.created_before || ""}
                                onChange={(e) => update({ created_before: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <SheetFooter className="px-5 py-4 border-t border-neutral-200 bg-white">
                    <div className="flex w-full items-center justify-between gap-2">
                        <Button
                            variant="ghost"
                            onClick={resetFilters}
                            className="rounded-4xl px-4 py-5 text-neutral-700 hover:bg-neutral-100"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>

                        <div className="flex items-center gap-2">
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
