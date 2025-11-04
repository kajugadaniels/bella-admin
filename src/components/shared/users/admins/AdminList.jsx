import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { superadmin } from "@/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import AdminFilters from "./AdminFilters";
import AdminTable from "./AdminTable";
import AdminDetailSheet from "./AdminDetailSheet";
import AdminDeleteDialog from "./AdminDeleteDialog";

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

const AdminList = () => {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounceLocal(query, 500);

    const [filters, setFilters] = useState({
        status: "all",
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

    // detail / delete
    const [detailId, setDetailId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            // top search bar (like StoreList)
            if (debouncedQuery.trim()) params.search = debouncedQuery.trim();

            // push filters
            Object.entries(filters).forEach(([k, v]) => {
                if (v !== "" && v !== null && v !== undefined) params[k] = v;
            });

            // ordering + page
            if (ordering) params.ordering = ordering;
            params.page = page;

            const { data } = await superadmin.listAdmins(params);
            // Expecting DRF pagination shape (like stores)
            setRows(data?.results || []);
            setCount(Number(data?.count || 0));
        } catch (err) {
            toast.error(err?.message || "Failed to load admins.");
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, filters, ordering, page]);

    useEffect(() => {
        setPage(1);
    }, [debouncedQuery, filters, ordering]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const refresh = useCallback(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const headerRight = useMemo(
        () => (
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    className="glass-button rounded-4xl px-4 py-5"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>
        ),
        [refresh]
    );

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
                                Admins
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">
                            Manage admin records and invitations.
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
                                placeholder="Search by email, username, or phone…"
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

                    <AdminFilters
                        value={{ ...filters, ordering }}
                        onChange={(next) => {
                            const { ordering: ord, ...rest } = next;
                            setFilters(rest);
                            setOrdering(ord || DEFAULT_ORDERING);
                        }}
                    />

                    <Separator className="soft-divider" />

                    <AdminTable
                        rows={rows}
                        loading={loading}
                        ordering={ordering}
                        onView={(id) => setDetailId(id)}
                        onDelete={(row) => setDeleteTarget(row)}
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
            </MotionDiv>

            {/* Detail */}
            {detailId && (
                <AdminDetailSheet
                    adminId={detailId}
                    open={!!detailId}
                    onOpenChange={(o) => {
                        if (!o) setDetailId(null);
                    }}
                    onDeleted={() => {
                        setDetailId(null);
                        refresh();
                    }}
                />
            )}

            {/* Delete */}
            {deleteTarget && (
                <AdminDeleteDialog
                    admin={deleteTarget}
                    open={!!deleteTarget}
                    onOpenChange={(o) => {
                        if (!o) setDeleteTarget(null);
                    }}
                    onDone={() => {
                        setDeleteTarget(null);
                        refresh();
                    }}
                />
            )}
        </>
    );
};

export default AdminList;
