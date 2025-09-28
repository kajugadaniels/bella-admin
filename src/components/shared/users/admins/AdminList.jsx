import React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { superadmin } from "@/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw, Search } from "lucide-react";
import AdminTable from "./AdminTable";
import AdminDetailSheet from "./AdminDetailSheet";
import AdminDeleteDialog from "./AdminDeleteDialog";

function extractToastError(err, fallback = "Something went wrong") {
    try {
        const msg =
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            fallback;
        return typeof msg === "string" ? msg : fallback;
    } catch {
        return fallback;
    }
}

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

export default function AdminList() {
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [prev, setPrev] = useState(null);

    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("all");
    const [ordering, setOrdering] = useState("-created_at");
    const [page, setPage] = useState(1);

    const [detailId, setDetailId] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);

    const params = useMemo(
        () => ({ q, status, ordering, page }),
        [q, status, ordering, page]
    );

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        try {
            const res = await superadmin.listAdmins(params);
            /**
             * Backends: we support either DRF native pagination OR your wrapped {status, data, count, next, previous}.
             */
            const payload = res?.data;
            const wrapped = payload?.data && (Array.isArray(payload?.data) || payload?.data?.results);
            const list = wrapped
                ? (payload?.data?.results || payload?.data || [])
                : (Array.isArray(payload) ? payload : payload?.results || []);
            const total = wrapped
                ? (payload?.count ?? payload?.data?.count ?? 0)
                : (payload?.count ?? 0);

            setRows(list || []);
            setCount(total);
            setNext((wrapped ? payload?.next ?? payload?.data?.next : payload?.next) || null);
            setPrev((wrapped ? payload?.previous ?? payload?.data?.previous : payload?.previous) || null);
        } catch (err) {
            toast.error(extractToastError(err, "Failed to load admins"));
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const onSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchAdmins();
    };

    const onOpenDetail = (row) => setDetailId(row?.id || row?.user_id || null);
    const onCloseDetail = (changed) => {
        setDetailId(null);
        if (changed) fetchAdmins();
    };

    const onOpenDelete = (row) => setDeleteRow(row);
    const onCloseDelete = (changed) => {
        setDeleteRow(null);
        if (changed) fetchAdmins();
    };

    return (
        <div className="space-y-4">
            {/* Header & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold">Admins</h1>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAdmins}
                        className="glass-button"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        <span className="ml-2">Refresh</span>
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <form onSubmit={onSearchSubmit} className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search email / username / phone…"
                                className="pl-8 w-[260px]"
                            />
                        </div>
                        <Button type="submit" className="glass-cta">Search</Button>
                    </form>

                    <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={ordering} onValueChange={(v) => { setOrdering(v); setPage(1); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Ordering" />
                        </SelectTrigger>
                        <SelectContent>
                            {orderings.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            {/* Table/List */}
            <AdminTable
                rows={rows}
                loading={loading}
                onView={onOpenDetail}
                onDelete={onOpenDelete}
                pagination={{
                    count,
                    page,
                    setPage,
                    hasNext: !!next,
                    hasPrev: !!prev,
                }}
            />

            {/* Detail sheet */}
            <AdminDetailSheet
                adminId={detailId}
                open={!!detailId}
                onOpenChange={(open) => !open && onCloseDetail(false)}
                onDeleted={() => onCloseDetail(true)}
            />

            {/* Delete dialog */}
            <AdminDeleteDialog
                admin={deleteRow}
                open={!!deleteRow}
                onOpenChange={(open) => !open && onCloseDelete(false)}
                onDone={() => onCloseDelete(true)}
            />
        </div>
    );
}
