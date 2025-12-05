import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Filter, Search } from "lucide-react";
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
        ordering: DEFAULT_ORDERING,
    });
    const [ordering, setOrdering] = useState(DEFAULT_ORDERING);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);

    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));

    const [detailId, setDetailId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};

            if (debouncedQuery.trim()) params.search = debouncedQuery.trim();

            Object.entries(filters).forEach(([k, v]) => {
                if (v !== "" && v !== null && v !== undefined) {
                    params[k] = v;
                }
            });

            params.ordering = ordering;
            params.page = page;

            const { data } = await superadmin.listAdmins(params);

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
                                Admins
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">
                            Manage admin records and invitations.
                        </p>
                    </div>
                </div>

                {/* CARD */}
                <div className="glass-card flex flex-col gap-4 p-4">

                    {/* TOP BAR */}
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
                                    placeholder="Search by email, username, or phone…"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="glass-input pl-9"
                                />
                            </div>
                        </div>

                        {/* Badge + Filters + Refresh */}
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="glass-badge">
                                {count} total
                            </Badge>

                            {/* Filter Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFiltersSheetOpen(true)}
                                className="glass-button rounded-4xl px-4"
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                            </Button>

                            {/* Refresh Button (same design) */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refresh}
                                className="glass-button rounded-4xl px-4"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <Separator className="soft-divider" />

                    {/* TABLE */}
                    <AdminTable
                        rows={rows}
                        loading={loading}
                        ordering={ordering}
                        onView={(id) => setDetailId(id)}
                        onDelete={(row) => setDeleteTarget(row)}
                    />

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
            <AdminFilters
                open={filtersSheetOpen}
                onOpenChange={setFiltersSheetOpen}
                value={{ ...filters, ordering }}
                onChange={(next) => {
                    const { ordering: ord, ...rest } = next;
                    setFilters(rest);
                    setOrdering(ord || DEFAULT_ORDERING);
                }}
            />

            {/* DETAIL SHEET */}
            {detailId && (
                <AdminDetailSheet
                    adminId={detailId}
                    open={!!detailId}
                    onOpenChange={(o) => !o && setDetailId(null)}
                    onDeleted={() => {
                        setDetailId(null);
                        refresh();
                    }}
                />
            )}

            {/* DELETE DIALOG */}
            {deleteTarget && (
                <AdminDeleteDialog
                    admin={deleteTarget}
                    open={!!deleteTarget}
                    onOpenChange={(o) => !o && setDeleteTarget(null)}
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
