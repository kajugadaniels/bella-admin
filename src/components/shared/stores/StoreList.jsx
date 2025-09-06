import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw } from "lucide-react";
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
import useDebounce from "@/hooks/useDebounce";

// Fallback debounce if "@/hooks/useDebounce" isn't present
function useDebounceLocal(value, delay = 500) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return v;
}

const DEFAULT_ORDERING = "-created_at";

const StoreList = () => {
    const [query, setQuery] = useState("");
    const debouncedQuery =
        typeof useDebounce === "function" ? useDebounce(query, 500) : useDebounceLocal(query, 500);

    const [filters, setFilters] = useState({
        has_admin: "",
        province: "",
        district: "",
        sector: "",
        created_after: "",
        created_before: "",
    });
    const [ordering, setOrdering] = useState(DEFAULT_ORDERING);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));

    // CRUD modals/sheets state
    const [createOpen, setCreateOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchStores = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (debouncedQuery.trim()) params.search = debouncedQuery.trim();
            Object.entries(filters).forEach(([k, v]) => {
                if (v !== "" && v !== null && v !== undefined) params[k] = v;
            });
            if (ordering) params.ordering = ordering;
            params.page = page;

            const { data } = await superadmin.listStores(params);
            setRows(data?.results || []);
            setCount(Number(data?.count || 0));
        } catch (err) {
            toast.error(err?.message || "Failed to load stores.");
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, filters, ordering, page]);

    useEffect(() => {
        setPage(1);
    }, [debouncedQuery, filters, ordering]);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    const refresh = useCallback(() => {
        fetchStores();
    }, [fetchStores]);

    const openEdit = (id) => setEditId(id);
    const openDelete = (row) => setDeleteTarget(row);

    const headerRight = useMemo(
        () => (
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={refresh} className="glass-button">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
                <Button size="sm" onClick={() => setCreateOpen(true)} className="glass-cta">
                    <Plus className="mr-2 h-4 w-4" />
                    New store
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
                                Stores
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">
                            Manage store records, admins, and invites.
                        </p>
                    </div>
                    {headerRight}
                </div>

                {/* Card */}
                <div className="glass-card flex flex-col gap-4 p-4">
                    {/* Top controls */}
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="col-span-2">
                            <Label htmlFor="q" className="sr-only">
                                Search
                            </Label>
                            <Input
                                id="q"
                                placeholder="Search by name, email, phone, address…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="glass-input"
                            />
                        </div>
                        <div className="flex items-center">
                            <Badge variant="secondary" className="ml-auto glass-badge">
                                {count} total
                            </Badge>
                        </div>
                    </div>

                    <StoreFilters
                        value={{ ...filters, ordering }}
                        onChange={(next) => {
                            const { ordering: ord, ...rest } = next;
                            setFilters(rest);
                            setOrdering(ord || DEFAULT_ORDERING);
                        }}
                    />

                    <Separator className="soft-divider" />

                    <StoreTable
                        rows={rows}
                        loading={loading}
                        ordering={ordering}
                        onEdit={openEdit}
                        onDelete={openDelete}
                    />

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

            {/* Create */}
            <StoreCreateSheet
                open={createOpen}
                onOpenChange={(o) => setCreateOpen(o)}
                onDone={() => {
                    setCreateOpen(false);
                    refresh();
                }}
            />

            {/* Update */}
            {editId && (
                <StoreUpdateSheet
                    id={editId}
                    open={!!editId}
                    onOpenChange={(o) => {
                        if (!o) setEditId(null);
                    }}
                    onDone={() => {
                        setEditId(null);
                        refresh();
                    }}
                />
            )}

            {/* Delete */}
            {deleteTarget && (
                <StoreDeleteDialog
                    store={deleteTarget}
                    open={!!deleteTarget}
                    onOpenChange={(o) => {
                        if (!o) setDeleteTarget(null);
                    }}
                    onDeleted={() => {
                        setDeleteTarget(null);
                        refresh();
                    }}
                />
            )}
        </>
    );
};

export default StoreList;
