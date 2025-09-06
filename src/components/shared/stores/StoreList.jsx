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
import { useDebounce } from "@/hooks/useDebounce"; // optional; fallback included below
import StoreFilters from "./StoreFilters";
import StoreTable from "./StoreTable";
import StoreCreateSheet from "./StoreCreateSheet";
import StoreUpdateSheet from "./StoreUpdateSheet";
import StoreDeleteDialog from "./StoreDeleteDialog";

// Fallback simple debounce hook if you don't have a shared one
// Comment out if you already have "@/hooks/useDebounce".
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
    const debouncedQuery = typeof useDebounce === "function" ? useDebounce(query, 500) : useDebounceLocal(query, 500);

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
            const params = new URLSearchParams();
            // Search (server supports ?search= across name/email/phone/address/location)
            if (debouncedQuery.trim()) params.set("search", debouncedQuery.trim());
            // Filters
            Object.entries(filters).forEach(([k, v]) => {
                if (v !== "" && v !== null && v !== undefined) params.set(k, v);
            });
            // Ordering + Pagination
            if (ordering && ordering !== DEFAULT_ORDERING) params.set("ordering", ordering);
            params.set("page", String(page));

            const { data } = await superadmin.listStores(`?${params.toString()}`);
            setRows(data?.results || []);
            setCount(Number(data?.count || 0));
        } catch (err) {
            toast.error(err?.message || "Failed to load stores.");
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, filters, ordering, page]);

    useEffect(() => {
        setPage(1); // reset page when filters/search/order change
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
                <Button variant="outline" size="sm" onClick={refresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
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
                className="mx-auto max-w-[1400px] px-4 sm:px-6"
            >
                <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Stores</h1>
                        <p className="text-sm text-neutral-500">
                            Manage store records, admins, and invites.
                        </p>
                    </div>
                    {headerRight}
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="col-span-2">
                            <Label htmlFor="q" className="sr-only">Search</Label>
                            <Input
                                id="q"
                                placeholder="Search by name, email, phone, address…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center">
                            <Badge variant="secondary" className="ml-auto">
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

                    <Separator />

                    <StoreTable
                        rows={rows}
                        loading={loading}
                        ordering={ordering}
                        onEdit={openEdit}
                        onDelete={openDelete}
                    />

                    {/* Pagination */}
                    <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-neutral-500">
                            Page {page} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
