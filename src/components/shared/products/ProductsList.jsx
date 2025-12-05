import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Search, Filter, Plus, SortAsc, SortDesc } from "lucide-react";
import { toast } from "sonner";

import { superadmin } from "@/api";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import ProductFiltersSheet from "./ProductFiltersSheet";
import { DEFAULT_PRODUCT_FILTERS } from "./productFiltersConstants";

import ProductDetailSheet from "./ProductDetailSheet";
import ProductCreateSheet from "./ProductCreateSheet";
import ProductUpdateSheet from "./ProductUpdateSheet";
import StockInDetailSheet from "./StockInDetailSheet";

import ProductTable from "./ProductTable"; // if using table separately
import ProductCard from "./ProductCard";   // if using cards separately

function useDebounceLocal(value, delay = 500) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return v;
}

const DEFAULT_ORDERING = "-created_at";
const PAGE_SIZE = 10;

const ProductsList = () => {
    /** Search */
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounceLocal(query, 500);

    /** Filters */
    const [filters, setFilters] = useState({ ...DEFAULT_PRODUCT_FILTERS });

    /** Sorting */
    const [ordering, setOrdering] = useState(DEFAULT_ORDERING);

    /** Pagination */
    const [page, setPage] = useState(1);

    /** Data */
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);

    /** Publish state */
    const [publishBusy, setPublishBusy] = useState({});

    /** Sheets */
    const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
    const [detailProductId, setDetailProductId] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [updateProductId, setUpdateProductId] = useState(null);
    const [stockInDetailId, setStockInDetailId] = useState(null);

    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

    /** Fetch data */
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

    /** Reset to page 1 when filters/search/order changes */
    useEffect(() => {
        setPage(1);
    }, [debouncedQuery, filters, ordering]);

    /** Fetch on mount + changes */
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const refresh = useCallback(() => fetchProducts(), [fetchProducts]);

    /** Toggle sorting ASC/DESC */
    const toggleOrdering = () => {
        setOrdering((prev) => (prev.startsWith("-") ? prev.slice(1) : `-${prev}`));
    };

    /** Publish toggle */
    const handlePublishToggle = async (productId, nextPublished) => {
        setRows((prev) =>
            prev.map((r) =>
                r?.product?.id === productId
                    ? { ...r, product: { ...r.product, published: nextPublished } }
                    : r
            )
        );

        setPublishBusy((s) => ({ ...s, [productId]: true }));

        try {
            await superadmin.publishProduct(productId);
            toast.success(nextPublished ? "Product published." : "Product unpublished.");
        } catch {
            // rollback
            setRows((prev) =>
                prev.map((r) =>
                    r?.product?.id === productId
                        ? { ...r, product: { ...r.product, published: !nextPublished } }
                        : r
                )
            );
            toast.error("Failed to update publish status.");
        } finally {
            setPublishBusy((s) => {
                const copy = { ...s };
                delete copy[productId];
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
                {/* Page header */}
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

                    {/* Right header buttons (Refresh + Add product) */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refresh}
                            className="glass-button rounded-4xl px-4"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>

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

                {/* CARD */}
                <div className="glass-card flex flex-col gap-4 p-4">

                    {/* SEARCH + FILTERS + COUNT */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Label htmlFor="q" className="sr-only">Search</Label>
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
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

                            {/* Filters */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFiltersSheetOpen(true)}
                                className="glass-button rounded-4xl px-4"
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                            </Button>

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

                    {/* TABLE (large screens) */}
                    <ProductTable
                        rows={rows}
                        loading={loading}
                        publishBusy={publishBusy}
                        onTogglePublish={handlePublishToggle}
                        onView={(id) => setDetailProductId(id)}
                        onEdit={(id) => setUpdateProductId(id)}
                        onBatch={(id) => setStockInDetailId(id)}
                    />

                    {/* CARDS (small screens) */}
                    <ProductCard
                        rows={rows}
                        loading={loading}
                        publishBusy={publishBusy}
                        onTogglePublish={handlePublishToggle}
                        onView={(id) => setDetailProductId(id)}
                        onEdit={(id) => setUpdateProductId(id)}
                        onBatch={(id) => setStockInDetailId(id)}
                    />

                    {/* Pagination */}
                    <div className="mt-1 flex items-center justify-between">
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

            {/* FILTERS SHEET */}
            <ProductFiltersSheet
                open={filtersSheetOpen}
                onOpenChange={setFiltersSheetOpen}
                value={filters}
                onChange={setFilters}
            />

            {/* PRODUCT DETAIL */}
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

            {/* STOCK-IN DETAIL */}
            {stockInDetailId && (
                <StockInDetailSheet
                    id={stockInDetailId}
                    open={!!stockInDetailId}
                    onOpenChange={(o) => !o && setStockInDetailId(null)}
                    onDone={refresh}
                />
            )}

            {/* CREATE */}
            <ProductCreateSheet
                open={createOpen}
                onOpenChange={setCreateOpen}
                onDone={refresh}
            />
        </>
    );
};

export default ProductsList;
