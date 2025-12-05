import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Filter,
    RefreshCw,
    Search,
    SortAsc,
    SortDesc,
    Plus,
} from "lucide-react";

import { toast } from "sonner";
import { superadmin } from "@/api";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { DEFAULT_PRODUCT_FILTERS } from "./productFiltersConstants";
import ProductFiltersSheet from "./ProductFiltersSheet";

import ProductDetailSheet from "./ProductDetailSheet";
import ProductCreateSheet from "./ProductCreateSheet";
import ProductUpdateSheet from "./ProductUpdateSheet";
import StockInDetailSheet from "./StockInDetailSheet";

import ProductCard from "./ProductThumb";    // extracted small card component (mobile)
import ProductThumb from "./ProductThumb";  // extracted thumbnail component
import ExpiryBadge from "./ExpiryBadge";    // extracted component

/* -------------------------------- Utils -------------------------------- */
function useDebounceLocal(v, d = 500) {
    const [val, setVal] = useState(v);
    useEffect(() => {
        const id = setTimeout(() => setVal(v), d);
        return () => clearTimeout(id);
    }, [v, d]);
    return val;
}

function fmtNum(n) {
    if (n === null || n === undefined) return "—";
    const num = Number(n);
    if (Number.isNaN(num)) return String(n);
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(num);
}
function dateOnly(iso) {
    if (!iso) return "—";
    try { return new Date(iso).toISOString().slice(0, 10); }
    catch { return String(iso); }
}

const DEFAULT_ORDERING = "-created_at";

const ProductsList = () => {
    /* SEARCH */
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounceLocal(query);

    /* FILTERS / ORDERING / PAGE */
    const [filters, setFilters] = useState({ ...DEFAULT_PRODUCT_FILTERS });
    const [ordering, setOrdering] = useState(DEFAULT_ORDERING);
    const [page, setPage] = useState(1);

    /* DATA */
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));

    /* MODALS */
    const [detailProductId, setDetailProductId] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [updateProductId, setUpdateProductId] = useState(null);
    const [stockInDetailId, setStockInDetailId] = useState(null);

    const [filtersOpen, setFiltersOpen] = useState(false);

    /* PUBLISH STATE */
    const [publishBusy, setPublishBusy] = useState({});

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

    useEffect(() => setPage(1), [debouncedQuery, filters, ordering]);
    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const refresh = useCallback(() => fetchProducts(), [fetchProducts]);

    const toggleOrdering = () => {
        setOrdering((prev) =>
            prev.startsWith("-") ? prev.slice(1) : `-${prev}`
        );
    };

    const togglePublish = async (id, next) => {
        setRows((prev) =>
            prev.map((r) =>
                r.product?.id === id
                    ? { ...r, product: { ...r.product, published: next } }
                    : r
            )
        );

        setPublishBusy((x) => ({ ...x, [id]: true }));

        try {
            await superadmin.publishProduct(id);
            toast.success(next ? "Product published." : "Product unpublished.");
        } catch {
            // rollback
            setRows((prev) =>
                prev.map((r) =>
                    r.product?.id === id
                        ? { ...r, product: { ...r.product, published: !next } }
                        : r
                )
            );
            toast.error("Failed to update publish status.");
        } finally {
            setPublishBusy((x) => {
                const copy = { ...x };
                delete copy[id];
                return copy;
            });
        }
    };

    const MotionDiv = motion.div;

    return (
        <>
            <MotionDiv
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="mx-auto px-4 sm:px-6"
            >
                {/* Header */}
                <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            <span className="bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 bg-clip-text text-transparent">
                                Products
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">
                            Inbound batches (StockIn) with remaining & values.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* FILTERS */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFiltersOpen(true)}
                            className="glass-button rounded-4xl px-4"
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                        </Button>

                        {/* REFRESH */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refresh}
                            className="glass-button rounded-4xl px-4"
                            disabled={loading}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>

                        {/* CREATE */}
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

                    {/* SEARCH */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 relative">
                            <Label htmlFor="product-search" className="sr-only">
                                Search
                            </Label>

                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />

                            <Input
                                id="product-search"
                                placeholder="Search by product or store name…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="glass-input pl-9"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="glass-badge">
                                {count} total
                            </Badge>

                            {/* Sort */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleOrdering}
                                className="glass-button rounded-4xl px-4"
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

                    {/* TABLE (desktop) */}
                    <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-black/5">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white/70 backdrop-blur">
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Store</TableHead>
                                    <TableHead className="text-right">Remaining</TableHead>
                                    <TableHead className="text-right">Discounted</TableHead>
                                    <TableHead className="text-right">Original</TableHead>
                                    <TableHead className="text-right">Gross</TableHead>
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
                                            <Skeleton className="h-32 w-full" />
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading && rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={10} className="py-10 text-center text-neutral-500">
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading &&
                                    rows.map((row) => {
                                        const p = row.product || {};
                                        const store = row.store;
                                        const q = row.quantities || {};
                                        const val = row.pricing || {};
                                        const d = row.dates || {};

                                        const isPublished = !!p.published;
                                        const busy = !!publishBusy[p.id];

                                        return (
                                            <TableRow key={row.id}>
                                                <TableCell>
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <ProductThumb src={p.image} alt={p.name} size={40} />
                                                        <div className="min-w-0">
                                                            <div className="truncate font-medium">{p.name}</div>
                                                            <div className="truncate text-xs text-neutral-500">{p.id}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>{store?.name || "Global"}</TableCell>

                                                <TableCell className="text-right">{fmtNum(q.remaining)}</TableCell>
                                                <TableCell className="text-right text-emerald-700 font-medium">
                                                    {fmtNum(val.unit_price)}
                                                </TableCell>
                                                <TableCell className="text-right line-through text-neutral-500">
                                                    {fmtNum(p.discount_price)}
                                                </TableCell>
                                                <TableCell className="text-right">{fmtNum(val.value_gross)}</TableCell>
                                                <TableCell className="text-right">{dateOnly(d.received_at)}</TableCell>
                                                <TableCell className="text-right">
                                                    {dateOnly(d.expiry_date)}
                                                    <ExpiryBadge expiryDate={d.expiry_date} />
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isPublished}
                                                        disabled={busy}
                                                        onChange={(e) => togglePublish(p.id, e.target.checked)}
                                                    />
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDetailProductId(p.id)}
                                                    >
                                                        <Search className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Cards (mobile) */}
                    <div className="grid gap-3 lg:hidden">
                        {loading &&
                            [...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                            ))}

                        {!loading && rows.length === 0 && (
                            <div className="p-6 text-center text-sm text-neutral-500">
                                No products found.
                            </div>
                        )}

                        {!loading &&
                            rows.map((row) => (
                                <ProductCard
                                    key={row.id}
                                    row={row}
                                    publishBusy={publishBusy}
                                    onTogglePublish={togglePublish}
                                    onView={(pid) => setDetailProductId(pid)}
                                    onEdit={(pid) => setUpdateProductId(pid)}
                                    onBatch={(sid) => setStockInDetailId(sid)}
                                />
                            ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-neutral-500">
                            Page {page} of {totalPages}
                        </span>

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

            {/* FILTER SHEET */}
            <ProductFiltersSheet
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                value={filters}
                onChange={setFilters}
            />

            {/* DETAIL SHEET */}
            {detailProductId && (
                <ProductDetailSheet
                    id={detailProductId}
                    open={!!detailProductId}
                    onOpenChange={(o) => !o && setDetailProductId(null)}
                />
            )}

            {/* UPDATE SHEET */}
            {updateProductId && (
                <ProductUpdateSheet
                    id={updateProductId}
                    open={!!updateProductId}
                    onOpenChange={(o) => !o && setUpdateProductId(null)}
                    onDone={refresh}
                />
            )}

            {/* STOCK-IN DETAIL SHEET */}
            {stockInDetailId && (
                <StockInDetailSheet
                    id={stockInDetailId}
                    open={!!stockInDetailId}
                    onOpenChange={(o) => !o && setStockInDetailId(null)}
                    onDone={refresh}
                />
            )}

            {/* CREATE SHEET */}
            <ProductCreateSheet
                open={createOpen}
                onOpenChange={setCreateOpen}
                onDone={refresh}
            />
        </>
    );
};

export default ProductsList;
