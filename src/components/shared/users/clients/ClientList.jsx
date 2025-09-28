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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import ClientTable from "./ClientTable";
import ClientDetailSheet from "./ClientDetailSheet";
import ClientDeleteDialog from "./ClientDeleteDialog";

function extractToastError(err, fallback = "Failed to load clients") {
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

const DEFAULT_ORDERING = "-created_at";
const statuses = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
];
const orderings = [
    { value: "-created_at", label: "Newest" },
    { value: "created_at", label: "Oldest" },
    { value: "email", label: "Email (A–Z)" },
    { value: "-email", label: "Email (Z–A)" },
    { value: "username", label: "Username (A–Z)" },
    { value: "-username", label: "Username (Z–A)" },
];

const ClientList = () => {
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("all");
    const [ordering, setOrdering] = useState(DEFAULT_ORDERING);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [prev, setPrev] = useState(null);

    const [detailId, setDetailId] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);

    const params = useMemo(
        () => ({ q, status, ordering, page }),
        [q, status, ordering, page]
    );

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const res = await superadmin.listClients(params);

            // Support both: wrapped {status,data,count,next,prev} and DRF {results,count,next,previous}
            const payload = res?.data;
            const wrapped = payload?.data && (Array.isArray(payload?.data) || payload?.data?.results);
            const list = wrapped
                ? (payload?.data?.results || payload?.data || [])
                : (Array.isArray(payload) ? payload : payload?.results || []);
            const total = wrapped
                ? (payload?.count ?? payload?.data?.count ?? 0)
                : (payload?.count ?? 0);

            setRows(list || []);
            setCount(Number(total || 0));
            setNext((wrapped ? payload?.next ?? payload?.data?.next : payload?.next) || null);
            setPrev((wrapped ? payload?.previous ?? payload?.data?.previous : payload?.previous) || null);
        } catch (err) {
            toast.error(extractToastError(err));
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const totalPages = Math.max(1, Math.ceil((count || 0) / 10)); // if your backend uses page_size=10

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
                                Clients
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">
                            Browse and manage client accounts (active & pending).
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchClients}
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
                                    placeholder="Search by email, username, phone…"
                                    value={q}
                                    onChange={(e) => {
                                        setQ(e.target.value);
                                        setPage(1);
                                    }}
                                    className="pl-9 glass-input"
                                />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Badge variant="secondary" className="ml-auto glass-badge">
                                {count} total
                            </Badge>
                        </div>
                    </div>

                    {/* Filters line (status + ordering) */}
                    <div
                        className="
              hidden md:flex items-end gap-3
              rounded-2xl border border-neutral-200 bg-white/70 p-3 backdrop-blur-sm
              dark:border-neutral-800 dark:bg-neutral-900/60
            "
                    >
                        <div className="min-w-[160px] flex-1">
                            <Label className="text-[12px]">Status</Label>
                            <Select
                                value={status}
                                onValueChange={(v) => {
                                    setStatus(v);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
                                    {statuses.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-[200px]">
                            <Label className="text-[12px]">Ordering</Label>
                            <Select
                                value={ordering}
                                onValueChange={(v) => {
                                    setOrdering(v);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
                                    <SelectValue placeholder="Sort by…" />
                                </SelectTrigger>
                                <SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
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
                                    setQ("");
                                    setStatus("all");
                                    setOrdering(DEFAULT_ORDERING);
                                    setPage(1);
                                }}
                                className="cursor-pointer text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>

                    <Separator className="soft-divider" />

                    {/* Table/List */}
                    <ClientTable
                        rows={rows}
                        loading={loading}
                        onView={(row) => setDetailId(row?.id || row?.user_id || row?.client_id)}
                        onDelete={(row) => setDeleteRow(row)}
                        pagination={{
                            count,
                            page,
                            setPage,
                            hasNext: !!next,
                            hasPrev: !!prev,
                        }}
                    />

                    {/* Pagination */}
                    <div className="mt-1 flex items-center justify-between">
                        <div className="text-xs text-neutral-500">
                            Page {page} {Number.isFinite(totalPages) ? `of ${totalPages}` : ""}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!prev || loading || page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="glass-button"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!next || loading}
                                onClick={() => setPage((p) => p + 1)}
                                className="glass-button"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Detail sheet */}
            <ClientDetailSheet
                clientId={detailId}
                open={!!detailId}
                onOpenChange={(o) => {
                    if (!o) setDetailId(null);
                }}
                onDeleted={() => {
                    setDetailId(null);
                    fetchClients();
                }}
            />

            {/* Delete dialog */}
            <ClientDeleteDialog
                client={deleteRow}
                open={!!deleteRow}
                onOpenChange={(o) => !o && setDeleteRow(null)}
                onDone={() => {
                    setDeleteRow(null);
                    fetchClients();
                }}
            />
        </>
    );
};

export default ClientList;
