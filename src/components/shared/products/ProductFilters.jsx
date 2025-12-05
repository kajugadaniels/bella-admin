import React, { useEffect, useMemo, useState } from "react";

import { superadmin } from "@/api";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";

import { RotateCcw, Search } from "lucide-react";
import { DEFAULT_PRODUCT_FILTERS } from "./productFiltersConstants";

const ALL_CATEGORIES_VALUE = "__ALL__";
const ALL_STORES_VALUE = "__ALL_STORES__";
const GLOBAL_STORE_VALUE = "__GLOBAL__";

const ProductFiltersSheet = ({ value, onChange, open, onOpenChange }) => {
    const v = value || DEFAULT_PRODUCT_FILTERS;

    /** Local draft state — applied only on Apply */
    const [draft, setDraft] = useState(v);

    useEffect(() => {
        if (open) setDraft(v);
    }, [open]);

    const update = (patch) => {
        setDraft((prev) => ({ ...prev, ...patch }));
    };

    const resetFilters = () => {
        setDraft(DEFAULT_PRODUCT_FILTERS);
    };

    const applyFilters = () => {
        onChange?.(draft);
        onOpenChange(false);
    };

    /* ----------------------- CATEGORY SELECT ----------------------- */
    const [catLoading, setCatLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        let ignore = false;
        async function run() {
            setCatLoading(true);
            try {
                const { data } = await superadmin.getProductCategories();
                const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
                const map = raw
                    .map((item) => {
                        if (typeof item === "string")
                            return { value: item, label: item };

                        const value =
                            String(item?.code ?? item?.value ?? item?.id ?? item?.name ?? "").trim();
                        const label =
                            String(item?.label ?? item?.name ?? item?.title ?? item?.code ?? "").trim();
                        return value ? { value, label } : null;
                    })
                    .filter(Boolean);

                const unique = Array.from(new Map(map.map((o) => [o.value, o])).values());
                if (!ignore) setCategories(unique);
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

    /* ----------------------- STORES SELECT ----------------------- */
    const [stores, setStores] = useState([]);
    const [storeQ, setStoreQ] = useState("");
    const [storeOpen, setStoreOpen] = useState(false);
    const [storeLoading, setStoreLoading] = useState(false);

    // Initial store fetch
    useEffect(() => {
        let ignore = false;
        async function run() {
            setStoreLoading(true);
            try {
                const { data } = await superadmin.listStores({ ordering: "name" });
                if (!ignore) setStores(data?.results || []);
            } catch {
                if (!ignore) setStores([]);
            } finally {
                if (!ignore) setStoreLoading(false);
            }
        }
        run();
        return () => (ignore = true);
    }, []);

    // Live search when open
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

        return () => {
            clearTimeout(id);
            ignore = true;
        };
    }, [storeQ, storeOpen]);

    const storeSelectValue = (() => {
        if (draft.store_id) return String(draft.store_id);
        if (draft.has_store === false) return GLOBAL_STORE_VALUE;
        return ALL_STORES_VALUE;
    })();

    const onStoreValueChange = (val) => {
        if (val === ALL_STORES_VALUE) return update({ store_id: "", has_store: "" });
        if (val === GLOBAL_STORE_VALUE) return update({ store_id: "", has_store: false });

        return update({ store_id: val, has_store: "" });
    };

    /* ------------------ ACTIVE CHIPS LABELS ------------------ */
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
        return Object.entries(draft)
            .filter(([k, val]) => val !== "" && val !== null && val !== undefined)
            .map(([k]) => labels[k] || k.replace("_", " "));
    }, [draft]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[90%] sm:w-[420px] p-0 flex flex-col bg-white"
            >
                <SheetHeader className="px-5 py-4 border-b border-neutral-200">
                    <SheetTitle className="text-left">Filters</SheetTitle>
                </SheetHeader>

                {/* Body scrollable */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

                    {/* CATEGORY */}
                    <div className="space-y-1">
                        <Label>Category</Label>
                        <Select
                            value={(draft.category && String(draft.category)) || ALL_CATEGORIES_VALUE}
                            onValueChange={(val) =>
                                update({ category: val === ALL_CATEGORIES_VALUE ? "" : val })
                            }
                            disabled={catLoading}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90">
                                <SelectValue placeholder="All categories" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-md">
                                <SelectItem value={ALL_CATEGORIES_VALUE}>
                                    All categories
                                </SelectItem>

                                {categories.length > 0 ? (
                                    categories.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-neutral-500 text-sm">
                                        {catLoading ? "Loading…" : "No categories."}
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* STORE */}
                    <div className="space-y-1">
                        <Label>Store</Label>
                        <Select
                            value={storeSelectValue}
                            onValueChange={onStoreValueChange}
                            onOpenChange={(o) => {
                                setStoreOpen(o);
                                if (!o) setStoreQ("");
                            }}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90">
                                <SelectValue placeholder="All stores" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-md p-0">
                                {/* Search bar */}
                                <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white p-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                        <Input
                                            placeholder="Search store…"
                                            value={storeQ}
                                            onChange={(e) => setStoreQ(e.target.value)}
                                            className="h-8 pl-8"
                                        />
                                    </div>
                                </div>

                                <SelectItem value={ALL_STORES_VALUE}>All stores</SelectItem>
                                <SelectItem value={GLOBAL_STORE_VALUE}>Global</SelectItem>

                                {!storeLoading &&
                                    stores.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}

                                {storeLoading && (
                                    <div className="p-2 text-neutral-500 text-sm">Loading…</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* SWITCHES */}
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <Label>Only with store</Label>
                            <Switch
                                checked={!!draft.has_store}
                                onCheckedChange={(c) =>
                                    update({ has_store: c ? true : "" })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label>Remaining &gt; 0</Label>
                            <Switch
                                checked={!!draft.has_remaining}
                                onCheckedChange={(c) =>
                                    update({ has_remaining: c ? true : "" })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label>Include voided</Label>
                            <Switch
                                checked={!!draft.is_void}
                                onCheckedChange={(c) =>
                                    update({ is_void: c ? true : "" })
                                }
                            />
                        </div>
                    </div>

                    {/* PRICE RANGE */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Min unit price</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={draft.min_unit_price ?? ""}
                                onChange={(e) => update({ min_unit_price: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>Max unit price</Label>
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

                    {/* CREATED RANGE */}
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

                    {/* ACTIVE FILTERS */}
                    {activeChips.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {activeChips.map((label) => (
                                <Badge key={label} variant="secondary" className="glass-badge">
                                    {label}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <SheetFooter className="border-t border-neutral-200 px-5 py-4 bg-white">
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
