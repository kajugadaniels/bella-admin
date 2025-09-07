import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    CircleAlert,
    Eye,
    ListFilter,
    Plus,
    RefreshCw,
    Search,
    SlidersHorizontal,
    SortAsc,
    SortDesc,
    Store,
} from "lucide-react";
import { toast } from "sonner";

import { superadmin } from "@/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

import ProductDetailSheet from "./ProductDetailSheet";
import ProductCreateSheet from "./ProductCreateSheet";

/* ---------- Fallback debounce if "@/hooks/useDebounce" isn't present ---------- */
function useDebounceLocal(value, delay = 500) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return v;
}

/* -------------------------------- Small helpers ------------------------------- */
function fmtNum(n) {
    if (n === null || n === undefined) return "—";
    const num = Number(n);
    if (Number.isNaN(num)) return String(n);
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(num);
}
function dateOnly(iso) {
    if (!iso) return "—";
    try {
        return new Date(iso).toISOString().slice(0, 10);
    } catch {
        return String(iso);
    }
}

/* --------------------------------- constants --------------------------------- */
const CATEGORY_OPTIONS = [
    "DRINKS",
    "DAIRY",
    "BAKERY",
    "FRUITS",
    "SNACKS",
    "MEAT",
    "FROZEN",
    "CLEANING",
    "PERSONAL_CARE",
    "OTHER",
];

const ORDERING_FIELDS = [
    { label: "Newest", value: "created_at" },
    { label: "Expiry date", value: "expiry_date" },
    { label: "Product name", value: "product__name" },
    { label: "Store name", value: "store__name" },
    { label: "Remaining qty", value: "remaining" },
    { label: "Unit price", value: "product__unit_price" },
    { label: "Net value", value: "value_net" },
    { label: "Gross value", value: "value_gross" },
];

/* --------------------------- Mini Card for small screens --------------------------- */
function ProductCard({ row, onView }) {
    const s = row || {};
    const p = s.product || {};
    const store = s.store;
    const q = s.quantities || {};
    const val = s.pricing || {};
    const d = s.dates || {};

    return (
        <div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/60">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="truncate font-medium">{p.name || "—"}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <Badge variant="secondary" className="glass-badge">{p.category || "UNCAT"}</Badge>
                        {store?.name ? <span className="truncate">· {store.name}</span> : <span className="truncate">· Global</span>}
                        <span className="truncate">· {dateOnly(d.received_at)}</span>
                        {d.expiry_date && <span className="truncate">· Exp {dateOnly(d.expiry_date)}</span>}
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onView?.(p.id)} className="cursor-pointer">
                    <Eye className="mr-1.5 h-4 w-4" /> Details
                </Button>
            </div>

            <Separator className="my-3" />

            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border border-black/5 bg-white/60 p-2 dark:border-white/10 dark:bg-neutral-900/50">
                    <div className="text-xs uppercase text-neutral-500">Remaining</div>
                    <div className="font-semibold">{fmtNum(q.remaining)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2 dark:border-white/10 dark:bg-neutral-900/50">
                    <div className="text-xs uppercase text-neutral-500">Received</div>
                    <div className="font-semibold">{fmtNum(q.received)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2 dark:border-white/10 dark:bg-neutral-900/50">
                    <div className="text-xs uppercase text-neutral-500">Unit price</div>
                    <div className="font-semibold">{fmtNum(val.unit_price)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2 dark:border-white/10 dark:bg-neutral-900/50">
                    <div className="text-xs uppercase text-neutral-500">Gross value</div>
                    <div className="font-semibold">{fmtNum(val.value_gross)}</div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------ Store filter select ------------------------------ */
function StoreFilterSelect({ value, onChange }) {
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
        run();
        return () => {
            ignore = true;
        };
    }, [q]);

    const current = useMemo(() => opts.find((o) => o.id === value) || null, [opts, value]);

    return (
        <div className="grid gap-1.5">
            <Label className="text-xs text-neutral-500">Store</Label>

            {/* Selected pill */}
            {value ? (
                <div className="flex items-center justify-between rounded-xl border border-black/5 bg-white/70 px-3 py-2 text-sm backdrop-blur dark:border-white/10 dark:bg-neutral-900/60">
                    <div className="min-w-0">
                        <div className="truncate font-medium">{current?.name || "Selected store"}</div>
                        <div className="truncate text-xs text-neutral-500">{value}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onChange("")} className="cursor-pointer">
                        Clear
                    </Button>
                </div>
            ) : (
                <>
                    {/* Search input */}
                    <div className="relative">
                        <Store className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search store…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="pl-8 glass-input"
                        />
                    </div>

                    {/* Results dropdown */}
                    <div className="relative">
                        <div className="absolute z-10 mt-2 w-full rounded-xl border border-black/5 bg-white/95 p-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/95">
                            <ScrollArea className="max-h-80">
                                {/* Global option */}
                                <button
                                    type="button"
                                    onClick={() => onChange("")}
                                    className="mb-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-black/[0.03] dark:hover:bg-white/5"
                                >
                                    <span className="truncate">Any store</span>
                                    <Badge variant="secondary" className="glass-badge">All</Badge>
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
                                    <div className="grid">
                                        {opts.map((o) => (
                                            <button
                                                type="button"
                                                key={o.id}
                                                onClick={() => onChange(o.id)}
                                                className="flex items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/5"
                                            >
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium">{o.name}</div>
                                                    <div className="truncate text-xs text-neutral-500">{o.id}</div>
                                                </div>
                                                <Badge variant={o.has_admin ? "default" : "secondary"} className="ml-auto glass-badge">
                                                    {o.has_admin ? "Has admin" : "No admin"}
                                                </Badge>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/* ------------------------------ Category select ------------------------------ */
function CategoryFilterSelect({ value, onChange }) {
    return (
        <div className="grid gap-1.5">
            <Label className="text-xs text-neutral-500" htmlFor="category">Category</Label>
            <select
                id="category"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 w-full rounded-xl border border-black/5 bg-white/90 px-3 text-sm outline-none transition-[box-shadow] focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-neutral-900"
            >
                <option value="">Any</option>
                {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
        </div>
    );
}

/* ------------------------------ Toggles (booleans) ------------------------------ */
function TogglesFilter({ value, onChange }) {
    const v = value || {};
    return (
        <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
                <Label className="text-xs text-neutral-500">Has store</Label>
                <div className="flex items-center gap-2">
                    <Switch
                        checked={!!v.has_store}
                        onCheckedChange={(c) => onChange({ ...v, has_store: c ? true : "" })}
                    />
                    <span className="text-sm">Only with store</span>
                </div>
            </div>
            <div className="grid gap-1.5">
                <Label className="text-xs text-neutral-500">Has remaining</Label>
                <div className="flex items-center gap-2">
                    <Switch
                        checked={!!v.has_remaining}
                        onCheckedChange={(c) => onChange({ ...v, has_remaining: c ? true : "" })}
                    />
                    <span className="text-sm">Remaining &gt; 0</span>
                </div>
            </div>
            <div className="grid gap-1.5">
                <Label className="text-xs text-neutral-500">Voided</Label>
                <div className="flex items-center gap-2">
                    <Switch
                        checked={!!v.is_void}
                        onCheckedChange={(c) => onChange({ ...v, is_void: c ? true : "" })}
                    />
                    <span className="text-sm">Include voided</span>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------ Price & date filters ------------------------------ */
function MoreFiltersMenu({ value, onChange }) {
    const v = value || {};
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="glass-button cursor-pointer">
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
                            onChange={(e) => onChange({ ...v, min_unit_price: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label className="text-xs">Max unit price</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={v.max_unit_price ?? ""}
                            onChange={(e) => onChange({ ...v, max_unit_price: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label className="text-xs">Expiring after</Label>
                            <Input
                                type="date"
                                value={v.expiring_after || ""}
                                onChange={(e) => onChange({ ...v, expiring_after: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs">Expiring before</Label>
                            <Input
                                type="date"
                                value={v.expiring_before || ""}
                                onChange={(e) => onChange({ ...v, expiring_before: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label className="text-xs">Created after</Label>
                            <Input
                                type="datetime-local"
                                value={v.created_after || ""}
                                onChange={(e) => onChange({ ...v, created_after: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs">Created before</Label>
                            <Input
                                type="datetime-local"
                                value={v.created_before || ""}
                                onChange={(e) => onChange({ ...v, created_before: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/* ------------------------------ Ordering control ------------------------------ */
function OrderingControl({ ordering, onChange }) {
    const dir = ordering.startsWith("-") ? "desc" : "asc";
    const field = ordering.replace(/^-/, "");

    const setField = (f) => onChange(dir === "desc" ? `-${f}` : f);
    const toggleDir = () => onChange(dir === "desc" ? field : `-${field}`);

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="glass-button">
                        {dir === "desc" ? <SortDesc className="mr-2 h-4 w-4" /> : <SortAsc className="mr-2 h-4 w-4" />}
                        Sort
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-menu w-56">
                    {ORDERING_FIELDS.map((o) => (
                        <DropdownMenuItem
                            key={o.value}
                            className="cursor-pointer"
                            onClick={() => setField(o.value)}
                        >
                            {o.label}
                        </DropdownMenuItem>
                    ))}
                    <Separator className="my-1" />
                    <DropdownMenuItem className="cursor-pointer" onClick={toggleDir}>
                        {dir === "desc" ? "Switch to ascending" : "Switch to descending"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant="secondary" className="glass-badge">
                {ORDERING_FIELDS.find((o) => o.value === field)?.label || "Custom"} · {dir.toUpperCase()}
            </Badge>
        </div>
    );
}

/* ------------------------------ Filters wrapper bar ------------------------------ */
function FiltersBar({ value, onChange }) {
    const v = value || {};
    const set = (patch) => onChange?.({ ...v, ...patch });

    return (
        <div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/60">
            <div className="grid gap-3 md:grid-cols-4">
                <CategoryFilterSelect value={v.category} onChange={(category) => set({ category })} />
                <StoreFilterSelect
                    value={v.store_id || ""}
                    onChange={(store_id) => set({ store_id, has_store: store_id ? true : v.has_store })}
                />
                <TogglesFilter value={v} onChange={set} />
                <div className="flex items-end justify-end gap-2">
                    <MoreFiltersMenu value={v} onChange={set} />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            onChange?.({
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
                            })
                        }
                        className="cursor-pointer"
                    >
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------ Main ------------------------------------ */
const DEFAULT_ORDERING = "-created_at";

const ProductsList = () => {
    // search
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounceLocal(query, 500);

    // filters/order/page
    const [filters, setFilters] = useState({
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
    });
    const [ordering, setOrdering] = useState(DEFAULT_ORDERING);
    const [page, setPage] = useState(1);

    // data
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));

    // modals
    const [detailProductId, setDetailProductId] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (debouncedQuery.trim()) params.search = debouncedQuery.trim();

            Object.entries(filters).forEach(([k, v]) => {
                if (v !== "" && v !== null && v !== undefined) params[k] = v;
            });

            if (ordering) params.ordering = ordering;
            params.page = page;

            const { data } = await superadmin.listProductsViaStockIn(params);
            setRows(data?.results || []);
            setCount(Number(data?.count || 0));
        } catch (err) {
            toast.error(err?.message || "Failed to load products.");
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, filters, ordering, page]);

    useEffect(() => {
        setPage(1);
    }, [debouncedQuery, filters, ordering]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const refresh = useCallback(() => fetchProducts(), [fetchProducts]);

    const headerRight = useMemo(
        () => (
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={refresh} className="glass-button rounded-4xl px-4 py-5">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
                <Button size="sm" onClick={() => setCreateOpen(true)} className="glass-cta rounded-4xl px-4 py-5">
                    <Plus className="mr-2 h-4 w-4" />
                    New product
                </Button>
            </div>
        ),
        [refresh]
    );

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="mx-auto px-4 sm:px-6"
            >
                {/* Page header */}
                <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            <span className="bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 bg-clip-text text-transparent">
                                Products
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">Inbound batches (StockIn) with remaining & values.</p>
                    </div>
                    {headerRight}
                </div>

                {/* Card */}
                <div className="glass-card flex flex-col gap-4 p-4">
                    {/* Top controls */}
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="col-span-2 relative">
                            <Label htmlFor="q" className="sr-only">Search</Label>
                            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                id="q"
                                placeholder="Search by product or store name…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-8 glass-input"
                            />
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-2">
                            <Badge variant="secondary" className="glass-badge">{count} total</Badge>
                            <OrderingControl ordering={ordering} onChange={setOrdering} />
                        </div>
                    </div>

                    {/* Filters */}
                    <FiltersBar value={filters} onChange={(f) => setFilters(f)} />

                    <Separator className="soft-divider" />

                    {/* Table (lg+) */}
                    <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-black/5 dark:ring-white/10">
                        <Table className="table-glassy">
                            <TableHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:bg-neutral-900/50">
                                <TableRow className="border-0">
                                    <TableHead className="min-w-[280px]">Product</TableHead>
                                    <TableHead>Store</TableHead>
                                    <TableHead className="text-right">Remaining</TableHead>
                                    <TableHead className="text-right">Unit&nbsp;Price</TableHead>
                                    <TableHead className="text-right">Gross&nbsp;Value</TableHead>
                                    <TableHead className="text-right">Received</TableHead>
                                    <TableHead className="text-right">Expiry</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow className="border-0">
                                        <TableCell colSpan={8} className="py-10">
                                            <div className="grid grid-cols-8 gap-3 px-2">
                                                {[...Array(8)].map((_, i) => (
                                                    <Skeleton key={i} className="h-5 w-full rounded-md col-span-1" />
                                                ))}
                                            </div>
                                            <div className="mt-3 grid gap-2">
                                                {[...Array(6)].map((_, i) => (
                                                    <Skeleton key={i} className="h-10 w-full rounded-md" />
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && (!rows || rows.length === 0) && (
                                    <TableRow className="border-0">
                                        <TableCell colSpan={8} className="py-10 text-center text-sm text-neutral-500">
                                            <div className="inline-flex items-center gap-2">
                                                <CircleAlert className="h-4 w-4" />
                                                No products found.
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading &&
                                    rows?.map((s) => {
                                        const p = s?.product || {};
                                        const store = s?.store;
                                        const q = s?.quantities || {};
                                        const val = s?.pricing || {};
                                        const d = s?.dates || {};
                                        return (
                                            <TableRow key={s.id} className="row-soft last:border-0 hover:bg-black/[0.025] dark:hover:bg-white/5 transition-colors">
                                                <TableCell>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium">{p.name}</div>
                                                        <div className="truncate text-xs text-neutral-500">{p.id}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="truncate text-sm">{store?.name || "Global"}</div>
                                                    <div className="truncate text-xs text-neutral-500">
                                                        <Badge variant="secondary" className="glass-badge">{p.category || "—"}</Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{fmtNum(q.remaining)}</TableCell>
                                                <TableCell className="text-right">{fmtNum(val.unit_price)}</TableCell>
                                                <TableCell className="text-right">{fmtNum(val.value_gross)}</TableCell>
                                                <TableCell className="text-right">{dateOnly(d.received_at)}</TableCell>
                                                <TableCell className="text-right">{dateOnly(d.expiry_date)}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 cursor-pointer">
                                                                <ListFilter className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="glass-menu">
                                                            <DropdownMenuItem className="cursor-pointer" onClick={() => setDetailProductId(p.id)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View details
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Cards (sm–md) */}
                    <div className="lg:hidden grid gap-3">
                        {loading && (
                            <div className="grid gap-3">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                                ))}
                            </div>
                        )}
                        {!loading && (!rows || rows.length === 0) && (
                            <div className="rounded-2xl border border-black/5 bg-white/70 p-6 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/60">
                                <div className="inline-flex items-center gap-2">
                                    <CircleAlert className="h-4 w-4" />
                                    No products found.
                                </div>
                            </div>
                        )}
                        {!loading &&
                            rows?.map((r) => <ProductCard key={r.id} row={r} onView={(pid) => setDetailProductId(pid)} />)}
                    </div>

                    {/* Pagination */}
                    <div className="mt-1 flex items-center justify-between">
                        <div className="text-xs text-neutral-500">
                            Page {page} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="glass-button"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="glass-button"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Detail */}
            {detailProductId && (
                <ProductDetailSheet
                    id={detailProductId}
                    open={!!detailProductId}
                    onOpenChange={(o) => {
                        if (!o) setDetailProductId(null);
                    }}
                />
            )}

            {/* Create */}
            <ProductCreateSheet
                open={createOpen}
                onOpenChange={setCreateOpen}
                onDone={() => {
                    setCreateOpen(false);
                    refresh();
                }}
            />
        </>
    );
};

export default ProductsList;
