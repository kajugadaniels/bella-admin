import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, Filter, Search } from "lucide-react";
import { toast } from "sonner";

import { superadmin } from "@/api";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import StoreFilters from "./StoreFilters";
import StoreTable from "./StoreTable";
import StoreCreateSheet from "./StoreCreateSheet";
import StoreUpdateSheet from "./StoreUpdateSheet";
import StoreDeleteDialog from "./StoreDeleteDialog";
import StoreDetailSheet from "./StoreDetailSheet";

import useDebounce from "@/hooks/useDebounce";

function useDebounceLocal(v, delay = 500) {
    const [value, setValue] = useState(v);
    useEffect(() => {
        const id = setTimeout(() => setValue(v), delay);
        return () => clearTimeout(id);
    }, [v, delay]);
    return value;
}

const DEFAULT_ORDERING = "-created_at";

const StoreList = () => {
    const [query, setQuery] = useState("");
    const debounceFn = typeof useDebounce === "function" ? useDebounce : useDebounceLocal;
    const debouncedQuery = debounceFn(query, 500);

    const [filters, setFilters] = useState({
        has_admin: "",
        province: "",
        district: "",
        sector: "",
        created_after: "",
        created_before: "",
        ordering: DEFAULT_ORDERING,
    });

    const [page, setPage] = useState(1);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));

    // sheets
    const [createOpen, setCreateOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [detailId, setDetailId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // NEW: filter sheet
    const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

    const fetchStores = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, ordering: filters.ordering };

            // search
            if (debouncedQuery.trim()) params.search = debouncedQuery.trim();

            // filters
            Object.entries(filters).forEach(([k, v]) => {
                if (v !== "" && v !== null && v !== undefined) {
                    params[k] = v;
                }
            });

            const { data } = await superadmin.listStores(params);
            setRows(data?.results || []);
            setCount(Number(data?.count || 0));
        } catch (err) {
            toast.error(err?.message || "Failed to load stores.");
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, filters, page]);

    useEffect(() => {
        setPage(1);
    }, [debouncedQuery, filters]);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    const refresh = () => fetchStores();

    const MotionDiv = motion.div;

    return (
        <>
            <MotionDiv
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="mx-auto px-4 sm:px-6"
            >
                {/* HEADER */}
                <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            <span className="bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 bg-clip-text text-transparent">
                                Stores
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">Manage store records and admins.</p>
                    </div>

                    <div className="flex items-center gap-2">
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

                        {/* Refresh */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refresh}
                            disabled={loading}
                            className="glass-button rounded-4xl px-4"
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
                            New Store
                        </Button>
                    </div>
                </div>

                {/* CARD */}
                <div className="glass-card flex flex-col gap-4 p-4">
                    {/* SEARCH ROW */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        {/* Search */}
                        <div className="flex-1">
                            <Label htmlFor="q" className="sr-only">
                                Search
                            </Label>
                            <div className="relative border border-neutral-400/20 focus-within:border-primary-500 rounded-lg">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-900" />
                                <Input
                                    id="q"
                                    placeholder="Search by name, email, phone, address…"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="glass-input pl-9"
                                />
                            </div>
                        </div>

                        <Badge variant="secondary" className="glass-badge">
                            {count} total
                        </Badge>
                    </div>

                    <Separator className="soft-divider" />

                    {/* TABLE */}
                    <StoreTable
                        rows={rows}
                        loading={loading}
                        ordering={filters.ordering}
                        onView={(id) => setDetailId(id)}
                        onEdit={(id) => setEditId(id)}
                        onDelete={(row) => setDeleteTarget(row)}
                    />

                    {/* PAGINATION */}
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
            <StoreFilters
                open={filtersSheetOpen}
                onOpenChange={setFiltersSheetOpen}
                value={filters}
                onChange={(next) => setFilters(next)}
            />

            {/* CREATE */}
            <StoreCreateSheet
                open={createOpen}
                onOpenChange={setCreateOpen}
                onDone={() => {
                    setCreateOpen(false);
                    refresh();
                }}
            />

            {/* DETAIL */}
            <StoreDetailSheet
                id={detailId}
                open={!!detailId}
                onOpenChange={(o) => !o && setDetailId(null)}
            />

            {/* UPDATE */}
            <StoreUpdateSheet
                id={editId}
                open={!!editId}
                onOpenChange={(o) => !o && setEditId(null)}
                onDone={() => {
                    setEditId(null);
                    refresh();
                }}
            />

            {/* DELETE */}
            <StoreDeleteDialog
                store={deleteTarget}
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
                onDeleted={() => {
                    setDeleteTarget(null);
                    refresh();
                }}
            />
        </>
    );
};

export default StoreList;
