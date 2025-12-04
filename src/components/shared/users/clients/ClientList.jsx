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

import ClientTable from "./ClientTable";
import ClientDetailSheet from "./ClientDetailSheet";
import ClientDeleteDialog from "./ClientDeleteDialog";
import ClientFilters from "./ClientFilters";

function useDebounceLocal(value, delay = 500) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return v;
}

const DEFAULT_ORDERING = "-created_at";
const DEFAULT_STATUS = "all";
const PAGE_SIZE = 10;

const ClientList = () => {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounceLocal(query, 500);

    const [filters, setFilters] = useState({
        status: DEFAULT_STATUS,
        ordering: DEFAULT_ORDERING,
    });

    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);

    const [detailId, setDetailId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

    const params = useMemo(() => {
        const p = { ...filters, page };

        if (debouncedQuery.trim()) {
            p.q = debouncedQuery.trim();
            p.search = debouncedQuery.trim();
        }

        return p;
    }, [debouncedQuery, filters, page]);

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const res = await superadmin.listClients(params);
            const payload = res?.data;

            let list = Array.isArray(payload?.results) ? payload.results : [];
            let total = typeof payload?.count === "number" ? payload.count : 0;

            if (!list.length && Array.isArray(payload?.data?.results)) {
                list = payload.data.results;
                total = payload.data.count ?? total;
            }

            const merged = list.map((r) => {
                const u = r?.user || {};
                const c = r?.client || {};

                return {
                    ...r,
                    __display: {
                        name: c?.name || u?.username || u?.email || "Client",
                        email: c?.email || u?.email || null,
                        phone: c?.phone_number || u?.phone_number || null,
                    },
                };
            });

            setRows(merged);
            setCount(Number(total || 0));
        } catch (err) {
            toast.error(err?.message || "Failed to load clients.");
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        setPage(1);
    }, [debouncedQuery, filters]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const refresh = useCallback(() => {
        fetchClients();
    }, [fetchClients]);

    const MotionDiv = motion.div;
    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

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
                                Clients
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">Manage client records and invitations.</p>
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
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
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
                        </div>
                    </div>

                    <Separator className="soft-divider" />

                    {/* TABLE */}
                    <ClientTable
                        rows={rows}
                        loading={loading}
                        onView={(row) => setDetailId(row?.client_id || row?.id)}
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

            {/* FILTER SHEET */}
            <ClientFilters
                open={filtersSheetOpen}
                onOpenChange={setFiltersSheetOpen}
                value={filters}
                onChange={(next) => setFilters(next)}
            />

            {/* DETAIL */}
            <ClientDetailSheet
                clientId={detailId}
                open={!!detailId}
                onOpenChange={(o) => !o && setDetailId(null)}
                onDeleted={() => {
                    setDetailId(null);
                    fetchClients();
                }}
            />

            {/* DELETE */}
            <ClientDeleteDialog
                client={deleteTarget}
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
                onDone={() => {
                    setDeleteTarget(null);
                    fetchClients();
                }}
            />
        </>
    );
};

export default ClientList;
