import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { superadmin } from "@/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import StockOutTable from "./StockOutTable";
import StockOutDetailSheet from "./StockOutDetailSheet";

/* -------------------------- local debounce fallback -------------------------- */
function useDebounceLocal(value, delay = 500) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return v;
}

const DEFAULT_ORDERING = "-created_at";
const DEFAULT_REASON = "ALL";
const DEFAULT_VOID = "ALL";
const PAGE_SIZE = 10;

const reasons = [
    { value: "ALL", label: "All" },
    { value: "SALE", label: "Sale" },
    { value: "ADJUSTMENT", label: "Adjustment" },
    { value: "DAMAGE", label: "Damage / Waste" },
    { value: "TRANSFER_OUT", label: "Transfer out" },
];

const voidStates = [
    { value: "ALL", label: "Any" },
    { value: "false", label: "Active only" },
    { value: "true", label: "Voided only" },
];

const orderings = [
    { value: "-created_at", label: "Newest" },
    { value: "created_at", label: "Oldest" },
    { value: "-quantity", label: "Qty (high→low)" },
    { value: "quantity", label: "Qty (low→high)" },
];

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

    const [reason, setReason] = useState(DEFAULT_REASON);
    const [isVoid, setIsVoid] = useState(DEFAULT_VOID);
    const [ordering, setOrdering] = useState(DEFAULT_ORDERING);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

    const [detailId, setDetailId] = useState(null);

    const params = useMemo(() => {
        const p = { ordering, page };
        if (debouncedQuery.trim()) {
            p.q = debouncedQuery.trim(); // backend supports q/name/product/store/order etc.
            p.search = debouncedQuery.trim();
        }
        if (reason !== "ALL") p.reason = reason;
        if (isVoid !== "ALL") p.is_void = isVoid; // "true" or "false"
        return p;
    }, [debouncedQuery, ordering, page, reason, isVoid]);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await superadmin.listStockOuts(params);
            const payload = res?.data;

            let list = Array.isArray(payload?.results) ? payload.results : [];
            let total = typeof payload?.count === "number" ? payload.count : 0;

            // Fallback shape compatibility
            if (!list.length) {
                const maybeWrapped = payload?.data;
                if (Array.isArray(maybeWrapped?.results)) {
                    list = maybeWrapped.results;
                    total = Number(payload?.count ?? maybeWrapped?.count ?? total);
                } else if (Array.isArray(maybeWrapped)) {
                    list = maybeWrapped;
                    total = maybeWrapped.length;
                }
            }

            setRows(list);
            setCount(Number(total || 0));
        } catch (err) {
            toast.error(extractToastError(err));
        } finally {
            setLoading(false);
        }
    }, [params]);

    // reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedQuery, reason, isVoid, ordering]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const refresh = useCallback(() => {
        fetchRows();
    }, [fetchRows]);

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
                                Stockouts
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">
                            Outgoing stock movements across products and stores.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refresh}
                            className="glass-button rounded-4xl px-4 py-5"
                            disabled={loading}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Card */}
                <div className="glass-card flex flex-col gap-4 p-4">
                    {/* Top controls */}
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="col-span-2">
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
                        <div className="flex items-center">
                            <Badge variant="secondary" className="ml-auto glass-badge">
                                {count} total
                            </Badge>
                        </div>
                    </div>

                    {/* Filters row */}
                    <div className="hidden md:flex items-end gap-3 rounded-2xl border border-neutral-200 bg-white/70 p-3 backdrop-blur-sm">
                        <div className="min-w-[160px]">
                            <Label className="text-[12px]">Reason</Label>
                            <Select value={reason} onValueChange={(v) => setReason(v)}>
                                <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200">
                                    <SelectValue placeholder="Reason" />
                                </SelectTrigger>
                                <SelectContent className="bg-white/95 backdrop-blur-md">
                                    {reasons.map((r) => (
                                        <SelectItem key={r.value} value={r.value}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-[160px]">
                            <Label className="text-[12px]">Voided</Label>
                            <Select value={isVoid} onValueChange={(v) => setIsVoid(v)}>
                                <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200">
                                    <SelectValue placeholder="Voided" />
                                </SelectTrigger>
                                <SelectContent className="bg-white/95 backdrop-blur-md">
                                    {voidStates.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-[180px]">
                            <Label className="text-[12px]">Ordering</Label>
                            <Select value={ordering} onValueChange={(v) => setOrdering(v)}>
                                <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200">
                                    <SelectValue placeholder="Sort by…" />
                                </SelectTrigger>
                                <SelectContent className="bg-white/95 backdrop-blur-md">
                                    {orderings.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-[120px] flex items-end">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setQuery("");
                                    setReason(DEFAULT_REASON);
                                    setIsVoid(DEFAULT_VOID);
                                    setOrdering(DEFAULT_ORDERING);
                                }}
                                className="cursor-pointer text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>

                    <Separator className="soft-divider" />

                    {/* Table */}
                    <StockOutTable
                        rows={rows}
                        loading={loading}
                        onView={(row) => setDetailId(row?.id)}
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

            {/* Detail sheet */}
            <StockOutDetailSheet
                stockoutId={detailId}
                open={!!detailId}
                onOpenChange={(o) => {
                    if (!o) setDetailId(null);
                }}
            />
        </>
    );
}
