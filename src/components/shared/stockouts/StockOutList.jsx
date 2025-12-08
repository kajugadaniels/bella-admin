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

import StockOutTable from "./StockOutTable";
import StockOutDetailSheet from "./StockOutDetailSheet";
import StockOutFilters from "./StockOutFilters";

/* -------------------------- debounce -------------------------- */
function useDebounceLocal(value, delay = 500) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return v;
}

const DEFAULT_FILTERS = {
    reason: "ALL",
    isVoid: "ALL",
    ordering: "-created_at",
};
const PAGE_SIZE = 10;

function extractToastError(err, fallback = "Failed to load stockouts.") {
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

export default function StockOutList() {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounceLocal(query, 500);

    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);

    const [detailId, setDetailId] = useState(null);
    const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

    const params = useMemo(() => {
        const p = { ordering: filters.ordering, page };

        if (debouncedQuery.trim()) {
            p.q = debouncedQuery.trim();
            p.search = debouncedQuery.trim();
        }

        if (filters.reason !== "ALL") p.reason = filters.reason;
        if (filters.isVoid !== "ALL") p.is_void = filters.isVoid;

        return p;
    }, [debouncedQuery, filters, page]);

    // fetchRows defined with useCallback — it is async but we will call it inside effects safely
    const fetchRows = useCallback(
        async (signal) => {
            setLoading(true);
            try {
                // If your API client supports AbortController signal, you could pass it in.
                const res = await superadmin.listStockOuts(params);
                const payload = res?.data;

                let list = Array.isArray(payload?.results) ? payload.results : [];
                let total = typeof payload?.count === "number" ? payload.count : 0;

                if (!list.length) {
                    const alt = payload?.data;
                    if (Array.isArray(alt?.results)) {
                        list = alt.results;
                        total = Number(payload?.count ?? alt?.count ?? total);
                    } else if (Array.isArray(alt)) {
                        list = alt;
                        total = alt.length;
                    }
                }

                if (!signal || !signal.aborted) {
                    setRows(list);
                    setCount(Number(total || 0));
                }
            } catch (err) {
                if (err?.name === "CanceledError" || err?.name === "AbortError") {
                    // fetch was aborted — ignore
                } else {
                    toast.error(extractToastError(err));
                }
            } finally {
                if (!signal || !signal.aborted) setLoading(false);
            }
        },
        [params]
    );

    // Reset page when filters/search change
    useEffect(() => {
        setPage(1);
    }, [debouncedQuery, filters]);

    // Correct usage: call async function inside effect, do not return the Promise
    useEffect(() => {
        // Optional: support cancellation using AbortController
        const controller = new AbortController();
        const signal = controller.signal;

        // Call fetchRows and pass signal (fetchRows ignores if not using it)
        fetchRows(signal);

        // cleanup: abort in-flight request on unmount or on deps change
        return () => {
            controller.abort();
        };
    }, [fetchRows]);

    const refresh = () => fetchRows();

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
                                Stockouts
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">
                            Outgoing stock movements across products and stores.
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
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                <Input
                                    id="q"
                                    placeholder="Search by product, order code, store, reason…"
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
                                disabled={loading}
                                onClick={refresh}
                                className="glass-button rounded-4xl px-4"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <Separator className="soft-divider" />

                    {/* Table */}
                    <StockOutTable rows={rows} loading={loading} onView={(row) => setDetailId(row?.id)} />

                    {/* Pagination */}
                    <div className="mt-1 flex items-center justify-between">
                        <div className="text-xs text-neutral-500">Page {page} of {totalPages}</div>

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
            <StockOutFilters open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen} value={filters} onChange={setFilters} />

            {/* DETAIL SHEET */}
            <StockOutDetailSheet stockoutId={detailId} open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)} />
        </>
    );
}
