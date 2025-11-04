import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ListFilter,
    Plus,
    RefreshCw,
    Search,
    SortAsc,
    SortDesc,
    Eye,
    CircleAlert,
    Layers,
    PencilLine,
} from "lucide-react";
import { toast } from "sonner";

import { superadmin } from "@/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import ProductFilters from "./ProductFilters";
import { DEFAULT_PRODUCT_FILTERS } from "./productFiltersConstants";

import ProductDetailSheet from "./ProductDetailSheet";
import ProductCreateSheet from "./ProductCreateSheet";
import ProductUpdateSheet from "./ProductUpdateSheet";
import StockInDetailSheet from "./StockInDetailSheet";

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

/* Days until helper (date-only safe) */
function daysUntil(dateStr) {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    // Normalize parsed target to date-only semantics
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

/* Expiry badge (color-coded) */
function ExpiryBadge({ expiryDate }) {
    const d = daysUntil(expiryDate);
    if (d === null) return null;

    let cls = "border text-xs px-2.5 py-0.5 rounded-full";
    let text = "";
    if (d <= 0) {
        cls += " bg-red-100 text-red-700 border-red-200";
        text = d === 0 ? "Today" : "Expired";
    } else if (d <= 2) {
        // Red when product has 2 days (or fewer) left
        cls += " bg-red-100 text-red-700 border-red-200";
        text = `${d}d left`;
    } else if (d <= 7) {
        cls +=
            " bg-amber-100 text-amber-700 border-amber-200";
        text = `${d}d left`;
    } else {
        cls +=
            " bg-emerald-100 text-emerald-700 border-emerald-200";
        text = `${d}d left`;
    }

    return <span className={cls}>{text}</span>;
}

/* ------------------------------- Image helpers ------------------------------- */
function SvgNotFound({ label = "Image not found" }) {
    return (
        <svg viewBox="0 0 120 120" role="img" aria-label={label} className="h-full w-full">
            <defs>
                <linearGradient id="nfGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(0,0,0,0.05)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
                </linearGradient>
            </defs>
            <rect width="120" height="120" fill="url(#nfGrad)" />
            <g opacity="0.35" transform="translate(30,30)">
                <path
                    d="M52 8H8a8 8 0 0 0-8 8v44a8 8 0 0 0 8 8h44a8 8 0 0 0 8-8V16a8 8 0 0 0-8-8Zm-6 36-8-10-12 16-8-10-10 14v4h48v-6l-10-8Z"
                    fill="currentColor"
                />
            </g>
            <text
                x="60"
                y="102"
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                opacity="0.55"
                style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" }}
            >
                Image not found
            </text>
        </svg>
    );
}

/** Smart thumbnail: lazy-loads, shows skeleton while loading, and falls back to an SVG when missing/broken */
function ProductThumb({ src, alt, size = 44, rounded = "rounded-xl", className = "" }) {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const showImg = !!src && !failed;

    return (
        <div
            className={[
                "relative shrink-0 overflow-hidden border border-black/5 bg-white/70",
                rounded,
                className,
            ].join(" ")}
            style={{ width: size, height: size }}
        >
            {showImg && (
                <img
                    src={src}
                    alt={alt || "Product image"}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    referrerPolicy="no-referrer"
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover"
                />
            )}

            {!showImg && <SvgNotFound />}

            {/* Skeleton while loading actual image */}
            {showImg && !loaded && (
                <div className="absolute inset-0">
                    <Skeleton className="h-full w-full" />
                </div>
            )}
        </div>
    );
}

/* --------------------------- Mini Card for small screens --------------------------- */
function ProductCard({ row, onView, onEdit, onBatch, onTogglePublish, publishBusy }) {
    const s = row || {};
    const p = s.product || {};
    const store = s.store;
    const q = s.quantities || {};
    const val = s.pricing || {};
    const d = s.dates || {};

    const isPublished = !!p.published;
    const busy = !!publishBusy?.[p.id];

    return (
        <div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                    <ProductThumb src={p.image || null} alt={p.name} size={44} />
                    <div className="min-w-0">
                        <div className="truncate font-medium">{p.name || "—"}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            <Badge variant="secondary" className="glass-badge">{p.category || "UNCAT"}</Badge>
                            {store?.name ? <span className="truncate">· {store.name}</span> : <span className="truncate">· Global</span>}
                            <span className="truncate">· {dateOnly(d.received_at)}</span>
                            {d.expiry_date && <span className="truncate">· Exp {dateOnly(d.expiry_date)}</span>}
                        </div>
                    </div>
                </div>

                {/* Publish toggle */}
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={isPublished}
                        disabled={busy}
                        onCheckedChange={(v) => onTogglePublish?.(p.id, !!v)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        aria-label={`Publish ${p.name || "product"}`}
                    />
                    <span className="text-xs text-neutral-600">{isPublished ? "Published" : "Unpublished"}</span>
                </div>
            </div>

            <Separator className="my-3" />

            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                    <div className="text-xs uppercase text-neutral-500">Remaining</div>
                    <div className="font-semibold">{fmtNum(q.remaining)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                    <div className="text-xs uppercase text-neutral-500">Received</div>
                    <div className="font-semibold">{fmtNum(q.received)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                    <div className="text-xs uppercase text-neutral-500">Unit price</div>
                    <div className="font-semibold">{fmtNum(val.unit_price)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                    <div className="text-xs uppercase text-neutral-500">Gross value</div>
                    <div className="font-semibold">{fmtNum(val.value_gross)}</div>
                </div>
            </div>

            {/* Mobile actions */}
            <div className="mt-3 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" className="glass-button" onClick={() => onBatch?.(s.id)}>
                    <Layers className="mr-2 h-4 w-4" />
                    Batch
                </Button>
                <Button variant="outline" size="sm" className="glass-button" onClick={() => onEdit?.(p.id)}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Edit
                </Button>
                <Button variant="outline" size="sm" className="glass-button" onClick={() => onView?.(p.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Details
                </Button>
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
    const [filters, setFilters] = useState({ ...DEFAULT_PRODUCT_FILTERS });
    const [ordering, setOrdering] = useState(DEFAULT_ORDERING);
    const [page, setPage] = useState(1);

    // data
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));

    // publish-in-flight flags (per product)
    const [publishBusy, setPublishBusy] = useState({}); // { [productId]: true }

    // modals
    const [detailProductId, setDetailProductId] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [updateProductId, setUpdateProductId] = useState(null);
    const [stockInDetailId, setStockInDetailId] = useState(null);

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

    const toggleOrdering = () => {
        if (ordering.startsWith("-")) setOrdering(ordering.slice(1));
        else setOrdering(`-${ordering}`);
    };

    /** Instant publish/unpublish with optimistic UI + rollback (server persists state) */
    const handlePublishToggle = async (productId, nextPublished) => {
        setRows((prev) =>
            (prev || []).map((r) =>
                r?.product?.id === productId ? { ...r, product: { ...r.product, published: nextPublished } } : r
            )
        );
        setPublishBusy((m) => ({ ...m, [productId]: true }));

        try {
            await superadmin.publishProduct(productId); // endpoint toggles/persists on server
            toast.success(nextPublished ? "Product published." : "Product unpublished.");
        } catch (err) {
            setRows((prev) =>
                (prev || []).map((r) =>
                    r?.product?.id === productId ? { ...r, product: { ...r.product, published: !nextPublished } } : r
                )
            );
            toast.error(err?.message || "Failed to update publish status.");
        } finally {
            setPublishBusy((m) => {
                const copy = { ...m };
                delete copy[productId];
                return copy;
            });
        }
    };

    // Make ESLint see a concrete JS usage
    const MotionDiv = motion.div;

    return (
        <>
            <MotionDiv
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
                        <div className="relative col-span-2">
                            <Label htmlFor="q" className="sr-only">
                                Search
                            </Label>
                            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            <Input
                                id="q"
                                placeholder="Search by product or store name…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="glass-input pl-8"
                            />
                        </div>
                        <div className="flex items-center justify-between gap-2 md:justify-end">
                            <Badge variant="secondary" className="glass-badge">
                                {count} total
                            </Badge>
                            <Button variant="outline" size="sm" onClick={toggleOrdering} className="glass-button">
                                {ordering.startsWith("-") ? (
                                    <SortDesc className="mr-2 h-4 w-4" />
                                ) : (
                                    <SortAsc className="mr-2 h-4 w-4" />
                                )}
                                Sort
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <ProductFilters value={filters} onChange={setFilters} />

                    <Separator className="soft-divider" />

                    {/* Table (lg+) */}
                    <div className="hidden overflow-x-auto rounded-xl ring-1 ring-black/5 lg:block">
                        <Table className="table-glassy">
                            <TableHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
                                <TableRow className="border-0">
                                    <TableHead className="min-w=[320px]">Product</TableHead>
                                    <TableHead>Store</TableHead>
                                    <TableHead className="text-right">Remaining</TableHead>
                                    <TableHead className="text-right">Unit&nbsp;Price</TableHead>
                                    <TableHead className="text-right">Gross&nbsp;Value</TableHead>
                                    <TableHead className="text-right">Received</TableHead>
                                    <TableHead className="text-right">Expiry</TableHead>
                                    <TableHead className="text-center">Published</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow className="border-0">
                                        <TableCell colSpan={9} className="py-10">
                                            <div className="grid grid-cols-9 gap-3 px-2">
                                                {[...Array(9)].map((_, i) => (
                                                    <Skeleton key={i} className="col-span-1 h-5 w-full rounded-md" />
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
                                        <TableCell colSpan={9} className="py-10 text-center text-sm text-neutral-500">
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
                                        const isPublished = !!p.published;
                                        const busy = !!publishBusy[p.id];

                                        return (
                                            <TableRow
                                                key={s.id}
                                                className="row-soft transition-colors last:border-0 hover:bg-black/[0.025]"
                                            >
                                                <TableCell>
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <ProductThumb src={p.image || null} alt={p.name} size={40} rounded="rounded-lg" />
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium">{p.name}</div>
                                                            <div className="truncate text-[11px] text-neutral-500">{p.id}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="truncate text-sm">{store?.name || "Global"}</div>
                                                    <div className="truncate text-xs text-neutral-500">
                                                        <Badge variant="secondary" className="glass-badge">
                                                            {p.category || "—"}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{fmtNum(q.remaining)}</TableCell>
                                                <TableCell className="text-right">{fmtNum(val.unit_price)}</TableCell>
                                                <TableCell className="text-right">{fmtNum(val.value_gross)}</TableCell>
                                                <TableCell className="text-right">{dateOnly(d.received_at)}</TableCell>

                                                {/* Expiry + days-left badge */}
                                                <TableCell className="text-right">
                                                    <div className="truncate text-sm">
                                                        {dateOnly(d.expiry_date)}
                                                    </div>
                                                    <ExpiryBadge expiryDate={d.expiry_date} />
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center gap-2">
                                                        <Checkbox
                                                            checked={isPublished}
                                                            disabled={busy}
                                                            onCheckedChange={(v) => handlePublishToggle(p.id, !!v)}
                                                            aria-label={`Publish ${p.name || "product"}`}
                                                            className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                                        />
                                                        <span className="text-xs text-neutral-600">
                                                            {isPublished ? "Published" : "Unpublished"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 cursor-pointer">
                                                                <ListFilter className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="glass-menu">
                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                onClick={() => setDetailProductId(p.id)}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View product details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                onClick={() => setStockInDetailId(s.id)}
                                                            >
                                                                <Layers className="mr-2 h-4 w-4" />
                                                                View batch (StockIn) details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                onClick={() => setUpdateProductId(p.id)}
                                                            >
                                                                <PencilLine className="mr-2 h-4 w-4" />
                                                                Update product
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
                    <div className="grid gap-3 lg:hidden">
                        {loading && (
                            <div className="grid gap-3">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                                ))}
                            </div>
                        )}
                        {!loading && (!rows || rows.length === 0) && (
                            <div className="rounded-2xl border border-black/5 bg-white/70 p-6 text-center text-sm text-neutral-500">
                                <div className="inline-flex items-center gap-2">
                                    <CircleAlert className="h-4 w-4" />
                                    No products found.
                                </div>
                            </div>
                        )}
                        {!loading &&
                            rows?.map((r) => (
                                <ProductCard
                                    key={r.id}
                                    row={r}
                                    publishBusy={publishBusy}
                                    onTogglePublish={handlePublishToggle}
                                    onView={(pid) => setDetailProductId(pid)}
                                    onEdit={(pid) => setUpdateProductId(pid)}
                                    onBatch={(sid) => setStockInDetailId(sid)}
                                />
                            ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-1 flex items-center justify-between">
                        <div className="text-xs text-neutral-500">Page {page} of {totalPages}</div>
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
            </MotionDiv>

            {/* Product detail */}
            {detailProductId && (
                <ProductDetailSheet
                    id={detailProductId}
                    open={!!detailProductId}
                    onOpenChange={(o) => {
                        if (!o) setDetailProductId(null);
                    }}
                />
            )}

            {/* Product update */}
            {updateProductId && (
                <ProductUpdateSheet
                    id={updateProductId}
                    open={!!updateProductId}
                    onOpenChange={(o) => {
                        if (!o) setUpdateProductId(null);
                    }}
                    onDone={refresh}
                />
            )}

            {/* StockIn detail (void/unvoid & delete supported inside) */}
            {stockInDetailId && (
                <StockInDetailSheet
                    id={stockInDetailId}
                    open={!!stockInDetailId}
                    onOpenChange={(o) => {
                        if (!o) setStockInDetailId(null);
                    }}
                    onDone={refresh}
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
