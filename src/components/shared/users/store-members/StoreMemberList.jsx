import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Search, Filter } from "lucide-react";
import { toast } from "sonner";

import { superadmin } from "@/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import StoreMemberTable from "./StoreMemberTable";
import StoreMemberDetailSheet from "./StoreMemberDetailSheet";
import StoreMemberDeleteDialog from "./StoreMemberDeleteDialog";
import StoreMemberFilters from "./StoreMemberFilters";

/* -------------------------- helpers -------------------------- */
const PAGE_SIZE = 10;
const DEFAULT_STATUS = "all";
const DEFAULT_ROLE = "all";
const DEFAULT_ORDERING = "-created_at";

function extractToastError(err, fallback = "Failed to load store members") {
    try {
        return (
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            fallback
        );
    } catch {
        return fallback;
    }
}

function useDebounceLocal(value, delay = 500) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return v;
}

// Normalize UI row shape
function normalizeMember(r = {}) {
    const id = r.membership_id || r.id;
    return {
        id,
        membership_id: id,
        status: r.status || "active",
        store: r.store || {},
        user: r.user || {},
        is_admin: !!r.is_admin,
        permissions: Array.isArray(r.permissions) ? r.permissions : [],
        is_active: r.is_active,
        role: r.role || r.user?.role,
        created_at: r.created_at,
    };
}

/* --------------------------- component --------------------------- */
export default function StoreMemberList() {
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [q, setQ] = useState("");
    const dq = useDebounceLocal(q, 500);

    const [filters, setFilters] = useState({
        status: DEFAULT_STATUS,
        role: DEFAULT_ROLE,
        ordering: DEFAULT_ORDERING,
    });

    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

    const [detailId, setDetailId] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);

    const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

    const params = useMemo(() => {
        const p = { ...filters, page };

        if (dq.trim()) {
            p.search = dq.trim();
            p.q = dq.trim();
        }

        // For role selection
        if (filters.role !== "all") {
            p.is_admin = filters.role === "admin";
        }

        return p;
    }, [dq, filters, page]);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await superadmin.listStoreMembers(params);
            const payload = res?.data || {};

            let list = Array.isArray(payload?.results) ? payload.results : [];
            let total = Number(payload?.count || 0);

            if (!list.length && payload?.data) {
                const d = payload.data;
                list = Array.isArray(d?.results) ? d.results : Array.isArray(d) ? d : [];
                total = Number(payload?.count ?? d?.count ?? total);
            }

            setRows(list.map(normalizeMember));
            setCount(total);
        } catch (err) {
            toast.error(extractToastError(err));
            setRows([]);
            setCount(0);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        setPage(1);
    }, [dq, filters]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const refresh = useCallback(() => fetchMembers(), [fetchMembers]);

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
                                Store Members
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">
                            Review and manage store memberships.
                        </p>
                    </div>
                </div>

                {/* CARD */}
                <div className="glass-card flex flex-col gap-4 p-4">

                    {/* TOP BAR — Search + Filters + Refresh */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                        {/* SEARCH */}
                        <div className="flex-1">
                            <Label htmlFor="q" className="sr-only">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                <Input
                                    id="q"
                                    placeholder="Search by email, username, phone, or store…"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    className="glass-input pl-9"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-3">

                            <Badge variant="secondary" className="glass-badge">
                                {count} total
                            </Badge>

                            {/* FILTER BUTTON */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFiltersSheetOpen(true)}
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
                                disabled={loading}
                                className="glass-button rounded-4xl px-4"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <Separator className="soft-divider" />

                    {/* TABLE */}
                    <StoreMemberTable
                        rows={rows}
                        loading={loading}
                        onView={(row) => setDetailId(row?.id)}
                        onDelete={(row) => setDeleteRow(row)}
                    />

                    {/* PAGINATION */}
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

            {/* FILTER SHEET */}
            <StoreMemberFilters
                open={filtersSheetOpen}
                onOpenChange={setFiltersSheetOpen}
                value={filters}
                onChange={(next) => setFilters(next)}
            />

            {/* DETAIL SHEET */}
            <StoreMemberDetailSheet
                membershipId={detailId}
                open={!!detailId}
                onOpenChange={(o) => !o && setDetailId(null)}
                onDeleted={() => {
                    setDetailId(null);
                    refresh();
                }}
            />

            {/* DELETE DIALOG */}
            <StoreMemberDeleteDialog
                member={deleteRow}
                open={!!deleteRow}
                onOpenChange={(o) => !o && setDeleteRow(null)}
                onDone={() => {
                    setDeleteRow(null);
                    refresh();
                }}
            />
        </>
    );
}
