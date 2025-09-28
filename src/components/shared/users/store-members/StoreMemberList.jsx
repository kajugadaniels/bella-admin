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

import StoreMemberTable from "./StoreMemberTable";
import StoreMemberDetailSheet from "./StoreMemberDetailSheet";
import StoreMemberDeleteDialog from "./StoreMemberDeleteDialog";

/* -------------------------- helpers -------------------------- */
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

/* -------------------------- constants -------------------------- */
const DEFAULT_ORDERING = "-created_at";
const DEFAULT_STATUS = "all";
const DEFAULT_ROLE = "all"; // all | admin | staff
const PAGE_SIZE = 10;

const statuses = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
];

const roles = [
    { value: "all", label: "All roles" },
    { value: "admin", label: "Admins only" },
    { value: "staff", label: "Staff only" },
];

const orderings = [
    { value: "-created_at", label: "Newest" },
    { value: "created_at", label: "Oldest" },
    { value: "store_name", label: "Store name (A–Z)" },
    { value: "-store_name", label: "Store name (Z–A)" },
    { value: "email", label: "Email (A–Z)" },
    { value: "-email", label: "Email (Z–A)" },
    { value: "username", label: "Username (A–Z)" },
    { value: "-username", label: "Username (Z–A)" },
];

/* --------------------------- component --------------------------- */
export default function StoreMemberList() {
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);

    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const dq = useDebounceLocal(q, 500);

    const [status, setStatus] = useState(DEFAULT_STATUS);
    const [role, setRole] = useState(DEFAULT_ROLE);
    const [ordering, setOrdering] = useState(DEFAULT_ORDERING);
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

    const [detailId, setDetailId] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);

    const params = useMemo(() => {
        const p = { status, ordering, page };
        if (dq.trim()) {
            p.q = dq.trim();       // allow both
            p.search = dq.trim();  // server can ignore one
        }
        if (role !== "all") {
            // server may accept: is_admin=true|false
            p.is_admin = role === "admin";
        }
        return p;
    }, [dq, status, ordering, page, role]);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await superadmin.listStoreMembers(params);

            // Prefer DRF pagination {count,results}
            const payload = res?.data;
            let list = Array.isArray(payload?.results) ? payload.results : [];
            let total = typeof payload?.count === "number" ? payload.count : 0;

            // tolerate wrapped responses: {status,data:{count,results}} or {data:[...]}
            if (!list.length) {
                const w = payload?.data;
                if (Array.isArray(w?.results)) {
                    list = w.results;
                    total = typeof (payload?.count ?? w?.count) === "number"
                        ? (payload?.count ?? w?.count)
                        : total;
                } else if (Array.isArray(w)) {
                    list = w;
                    total = w.length;
                }
            }

            setRows(list || []);
            setCount(Number(total || 0));
        } catch (err) {
            toast.error(extractToastError(err));
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        setPage(1);
    }, [dq, status, ordering, role]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const refresh = useCallback(() => fetchMembers(), [fetchMembers]);

    return (
        <>
            <motion.div
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
                                Store members
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500">
                            Review store memberships across all stores.
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
                                    placeholder="Search by email, username, phone, or store…"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
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
                    <div
                        className="
              hidden md:flex items-end gap-3
              rounded-2xl border border-neutral-200 bg-white/70 p-3 backdrop-blur-sm
              dark:border-neutral-800 dark:bg-neutral-900/60
            "
                    >
                        {/* Status */}
                        <div className="min-w-[150px] flex-1">
                            <Label className="text-[12px]">Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v)}>
                                <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
                                    <SelectValue placeholder="Status" />
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

                        {/* Role (is_admin) */}
                        <div className="min-w-[170px] flex-1">
                            <Label className="text-[12px]">Role</Label>
                            <Select value={role} onValueChange={(v) => setRole(v)}>
                                <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
                                    <SelectValue placeholder="All roles" />
                                </SelectTrigger>
                                <SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
                                    {roles.map((r) => (
                                        <SelectItem key={r.value} value={r.value}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Ordering */}
                        <div className="min-w-[180px]">
                            <Label className="text-[12px]">Ordering</Label>
                            <Select value={ordering} onValueChange={(v) => setOrdering(v)}>
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

                        {/* Reset */}
                        <div className="min-w-[120px] flex items-end">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setQ("");
                                    setStatus(DEFAULT_STATUS);
                                    setRole(DEFAULT_ROLE);
                                    setOrdering(DEFAULT_ORDERING);
                                }}
                                className="cursor-pointer text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>

                    <Separator className="soft-divider" />

                    {/* Table/List */}
                    <StoreMemberTable
                        rows={rows}
                        loading={loading}
                        onView={(row) => setDetailId(row?.id || row?.membership_id)}
                        onDelete={(row) => setDeleteRow(row)}
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
            <StoreMemberDetailSheet
                membershipId={detailId}
                open={!!detailId}
                onOpenChange={(o) => {
                    if (!o) setDetailId(null);
                }}
                onDeleted={() => {
                    setDetailId(null);
                    refresh();
                }}
            />

            {/* Delete dialog */}
            <StoreMemberDeleteDialog
                member={deleteRow}
                open={!!deleteRow}
                onOpenChange={(o) => {
                    if (!o) setDeleteRow(null);
                }}
                onDone={() => {
                    setDeleteRow(null);
                    refresh();
                }}
            />
        </>
    );
}
