import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    RefreshCw,
    Search,
    SortAsc,
    SortDesc,
    Eye,
    CircleAlert,
    Layers,
    PencilLine,
    MoreHorizontal,
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

import ProductFiltersSheet from "./ProductFiltersSheet";
import { DEFAULT_PRODUCT_FILTERS } from "./productFiltersConstants";

import ProductDetailSheet from "./ProductDetailSheet";
import ProductCreateSheet from "./ProductCreateSheet";
import ProductUpdateSheet from "./ProductUpdateSheet";
import StockInDetailSheet from "./StockInDetailSheet";

/* ---------- Debounce fallback ---------- */
function useDebounceLocal(value, delay = 500) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return v;
}

/* ---------- Helpers ---------- */
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

function daysUntil(dateStr) {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function ExpiryBadge({ expiryDate }) {
    const d = daysUntil(expiryDate);
    if (d === null) return null;

    let cls = "border text-xs px-2.5 py-0.5 rounded-full";
    let text = "";

    if (d <= 0) {
        cls += " bg-red-100 text-red-700 border-red-200";
        text = d === 0 ? "Today" : "Expired";
    } else if (d <= 2) {
        cls += " bg-red-100 text-red-700 border-red-200";
        text = `${d}d left`;
    } else if (d <= 7) {
        cls += " bg-amber-100 text-amber-700 border-amber-200";
        text = `${d}d left`;
    } else {
        cls += " bg-emerald-100 text-emerald-700 border-emerald-200";
        text = `${d}d left`;
    }

    return <span className={cls}>{text}</span>;
}

function SvgNotFound() {
    return (
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-label="Image not found">
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
        </svg>
    );
}

function ProductThumb({ src, alt, size = 44, rounded = "rounded-xl" }) {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const showImg = !!src && !failed;

    return (
        <div
            className={`relative shrink-0 overflow-hidden border border-black/5 bg-white/70 ${rounded}`}
            style={{ width: size, height: size }}
        >
            {showImg && (
                <img
                    src={src}
                    alt={alt}
                    className="h-full w-full object-cover"
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                />
            )}

            {!showImg && <SvgNotFound />}

            {showImg && !loaded && (
                <div className="absolute inset-0">
                    <Skeleton className="h-full w-full" />
                </div>
            )}
        </div>
    );
}

/* ------------------------------ Mobile Card ------------------------------ */
function ProductCard({ row, onView, onEdit, onBatch, publishBusy, onTogglePublish }) {
    const s = row || {};
    const p = s.product || {};
    const store = s.store;
    const q = s.quantities || {};
    const val = s.pricing || {};
    const d = s.dates || {};

    const busy = !!publishBusy?.[p.id];

    return (
        <div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <ProductThumb src={p.image} alt={p.name} />
                    <div className="min-w-0">
                        <div className="truncate font-medium">{p.name}</div>
                        {p.discount_rate > 0 && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                                -{fmtNum(p.discount_rate)}%
                            </Badge>
                        )}
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            <Badge variant="secondary" className="glass-badge">
                                {p.category || "UNCAT"}
                            </Badge>
                            <span>· {store?.name || "Global"}</span>
                            <span>· {dateOnly(d.received_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={!!p.published}
                        disabled={busy}
                        onCheckedChange={(v) => onTogglePublish?.(p.id, !!v)}
                        className="data-[state=checked]:bg-emerald-600"
                    />
                </div>
            </div>

            <Separator className="my-3" />

            {/* VALUE GRID */}
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                    <div className="text-xs text-neutral-500">Remaining</div>
                    <div className="font-semibold">{fmtNum(q.remaining)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                    <div className="text-xs text-neutral-500">Received</div>
                    <div className="font-semibold">{fmtNum(q.received)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2">
                    <div className="text-xs text-neutral-500">Discounted</div>
                    <div className="font-semibold text-emerald-700">{fmtNum(val.unit_price)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2 line-through">
                    <div className="text-xs text-neutral-500">Original</div>
                    <div className="font-semibold">{fmtNum(p.discount_price)}</div>
                </div>

                <div className="rounded-xl border border-black/5 bg-white/60 p-2 col-span-2">
                    <div className="text-xs text-neutral-500">Discount</div>
                    <div className="font-medium text-amber-600">{fmtNum(p.discount_rate)}%</div>
                </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onBatch?.(row.id)} className="glass-button">
                    <Layers className="h-4 w-4 mr-2" /> Batch
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit?.(p.id)} className="glass-button">
                    <PencilLine className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onView?.(p.id)} className="glass-button">
                    <Eye className="h-4 w-4 mr-2" /> Details
                </Button>
            </div>
        </div>
    );
}

/* --------------------------- MAIN COMPONENT --------------------------- */

const DEFAULT_ORDERING = "-created_at";

const ProductsList = () => {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounceLocal(query, 500);

    const [filters, setFilters] = useState({ ...DEFAULT_PRODUCT_FILTERS });
    const [ordering, setOrdering] = useState(DEFAULT_ORDERING);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);

    const [publishBusy, setPublishBusy] = useState({});

    const [detailProductId, setDetailProductId] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [updateProductId, setUpdateProductId] = useState(null);
    const [stockInDetailId, setStockInDetailId] = useState(null);

    const [filtersOpen, setFiltersOpen] = useState(false);

    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));

    /* --------------------------- Fetch Products --------------------------- */
    const fetchProducts = useCallback(async () => {
        setLoading(true);

        try {
            const params = {};

            if (debouncedQuery.trim()) params.search = debouncedQuery.trim();

            Object.entries(filters).forEach(([k, v]) => {
                if (v !== "" && v !== null && v !== undefined) params[k] = v;
            });

            params.ordering = ordering;
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

    /* -------------------------- Publish toggle -------------------------- */
    const handlePublishToggle = async (productId, next) => {
        setRows((prev) =>
            prev.map((r) =>
                r.product?.id === productId
                    ? { ...r, product: { ...r.product, published: next } }
                    : r
            )
        );

        setPublishBusy((m) => ({ ...m, [productId]: true }));

        try {
            await superadmin.publishProduct(productId);
            toast.success(next ? "Product published." : "Product unpublished.");
        } catch {
            setRows((prev) =>
                prev.map((r) =>
                    r.product?.id === productId
                        ? { ...r, product: { ...r.product, published: !next } }
                        : r
                )
            );
            toast.error("Failed to update publish status.");
        } finally {
            setPublishBusy((m) => {
                const copy = { ...m };
                delete copy[productId];
                return copy;
            });
        }
    };

    const MotionDiv = motion.div;

    /* ------------------------------ UI ------------------------------ */

    return (
        <>
            <MotionDiv
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="mx-auto px-4 sm:px-6"
            >
                {/* Page Header */}
                <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            <span className="bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 bg-clip-text text-transparent">
                                Products
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">
                            Inbound batches (StockIn) with quantities, pricing & expiry information.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* FILTERS BUTTON */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFiltersOpen(true)}
                            className="glass-button rounded-4xl px-4"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 019 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                            </svg>
                            Filters
                        </Button>

                        {/* REFRESH BUTTON */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refresh}
                            className="glass-button rounded-4xl px-4"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>

                        {/* NEW PRODUCT */}
                        <Button
                            size="sm"
                            onClick={() => setCreateOpen(true)}
                            className="glass-cta rounded-4xl px-4"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New product
                        </Button>
                    </div>
                </div>

                {/* Card */}
                <div className="glass-card flex flex-col gap-4 p-4">
                    {/* Top Bar: Search + Count + Sort */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 relative">
                            <Label htmlFor="q" className="sr-only">
                                Search
                            </Label>
                            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                id="q"
                                placeholder="Search by product or store name…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="glass-input pl-8"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="glass-badge">
                                {count} total
                            </Badge>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setOrdering((prev) => (prev.startsWith("-") ? prev.slice(1) : `-${prev}`))
                                }
                                className="glass-button"
                            >
                                {ordering.startsWith("-") ? (
                                    <SortDesc className="mr-2 h-4 w-4" />
                                ) : (
                                    <SortAsc className="mr-2 h-4 w-4" />
                                )}
                                Sort
                            </Button>
                        </div>
                    </div>

                    <Separator className="soft-divider" />

                    {/* TABLE (Desktop) */}
                    <div className="hidden overflow-x-auto rounded-xl ring-1 ring-black/5 lg:block">
                        <Table className="table-glassy">
                            <TableHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur">
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Store</TableHead>
                                    <TableHead className="text-right">Remaining</TableHead>
                                    <TableHead className="text-right">Discounted</TableHead>
                                    <TableHead className="text-right line-through">Original</TableHead>
                                    <TableHead className="text-right">Gross Value</TableHead>
                                    <TableHead className="text-right">Received</TableHead>
                                    <TableHead className="text-right">Expiry</TableHead>
                                    <TableHead className="text-center">Published</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={10} className="py-10">
                                            <Skeleton className="h-10 w-full" />
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading && rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={10} className="py-10 text-center text-sm text-neutral-500">
                                            <CircleAlert className="h-4 w-4 inline-block mr-2" />
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading &&
                                    rows.map((s) => {
                                        const p = s.product || {};
                                        const store = s.store;
                                        const q = s.quantities || {};
                                        const v = s.pricing || {};
                                        const d = s.dates || {};

                                        const busy = publishBusy[p.id];

                                        return (
                                            <TableRow key={s.id} className="hover:bg-black/5">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <ProductThumb src={p.image} alt={p.name} size={40} rounded="rounded-lg" />
                                                        <div>
                                                            <div className="font-medium">{p.name}</div>
                                                            {p.discount_rate > 0 && (
                                                                <span className="text-xs text-amber-600">
                                                                    -{fmtNum(p.discount_rate)}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="truncate">{store?.name || "Global"}</div>
                                                    <Badge variant="secondary" className="glass-badge text-xs">
                                                        {p.category || "—"}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-right">{fmtNum(q.remaining)}</TableCell>
                                                <TableCell className="text-right text-emerald-700 font-medium">
                                                    {fmtNum(v.unit_price)}
                                                </TableCell>
                                                <TableCell className="text-right text-neutral-600 line-through">
                                                    {fmtNum(p.discount_price)}
                                                </TableCell>
                                                <TableCell className="text-right">{fmtNum(v.value_gross)}</TableCell>
                                                <TableCell className="text-right">{dateOnly(d.received_at)}</TableCell>

                                                <TableCell className="text-right">
                                                    {dateOnly(d.expiry_date)}
                                                    <div>
                                                        <ExpiryBadge expiryDate={d.expiry_date} />
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={!!p.published}
                                                        disabled={busy}
                                                        onCheckedChange={(v) =>
                                                            handlePublishToggle(p.id, !!v)
                                                        }
                                                        className="data-[state=checked]:bg-emerald-600"
                                                    />
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="glass-menu">
                                                            <DropdownMenuItem
                                                                onClick={() => setDetailProductId(p.id)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View product details
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                onClick={() => setStockInDetailId(s.id)}
                                                            >
                                                                <Layers className="mr-2 h-4 w-4" />
                                                                View batch details
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                onClick={() => setUpdateProductId(p.id)}
                                                                className="cursor-pointer"
                                                            >
                                                                <PencilLine className="mr-2 h-4 w-4" />
                                                                Edit product
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

                    {/* MOBILE CARDS */}
                    <div className="grid gap-3 lg:hidden">
                        {loading && [...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                        ))}

                        {!loading && rows.length === 0 && (
                            <div className="rounded-xl p-4 text-center text-sm text-neutral-500">
                                <CircleAlert className="h-4 w-4 inline-block mr-2" />
                                No products found.
                            </div>
                        )}

                        {!loading &&
                            rows.map((r) => (
                                <ProductCard
                                    key={r.id}
                                    row={r}
                                    publishBusy={publishBusy}
                                    onTogglePublish={handlePublishToggle}
                                    onView={(id) => setDetailProductId(id)}
                                    onEdit={(id) => setUpdateProductId(id)}
                                    onBatch={(sid) => setStockInDetailId(sid)}
                                />
                            ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-neutral-500">
                            Page {page} of {totalPages}
                        </span>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1 || loading}
                                className="glass-button"
                            >
                                Previous
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                                className="glass-button"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </MotionDiv>

            {/* FILTER SHEET */}
            <ProductFiltersSheet
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                value={filters}
                onChange={(next) => setFilters(next)}
            />

            {/* DETAIL */}
            {detailProductId && (
                <ProductDetailSheet
                    id={detailProductId}
                    open={!!detailProductId}
                    onOpenChange={(o) => !o && setDetailProductId(null)}
                />
            )}

            {/* UPDATE */}
            {updateProductId && (
                <ProductUpdateSheet
                    id={updateProductId}
                    open={!!updateProductId}
                    onOpenChange={(o) => !o && setUpdateProductId(null)}
                    onDone={refresh}
                />
            )}

            {/* STOCK IN DETAIL */}
            {stockInDetailId && (
                <StockInDetailSheet
                    id={stockInDetailId}
                    open={!!stockInDetailId}
                    onOpenChange={(o) => !o && setStockInDetailId(null)}
                    onDone={refresh}
                />
            )}

            {/* CREATE PRODUCT */}
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
