import React from "react";
import { Eye, MoreHorizontal, Trash2, Shield, UserCircle2 } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name = "") {
    const s = (name || "").trim();
    if (!s) return "A";
    if (s.includes("@")) return s.slice(0, 1).toUpperCase();
    const parts = s.split(/\s+/);
    return ((parts[0]?.[0] || "A") + (parts[1]?.[0] || s[1] || "")).toUpperCase();
}

function normalize(row) {
    const id = row?.id || row?.user_id || row?.admin_id;
    const email = row?.email || row?.user?.email || "";
    const username = row?.username || row?.user?.username || "";
    const phone = row?.phone_number || row?.user?.phone_number || "";
    const created_at = row?.created_at || row?.user?.created_at;
    const status = row?.status || "active";
    const role = row?.role || row?.user?.role || "ADMIN";
    const image = row?.image || row?.user?.image_url || row?.user?.image;
    const is_superuser = !!(row?.is_superuser ?? row?.user?.is_superuser);
    return { id, email, username, phone, created_at, status, role, image, is_superuser };
}

const AdminCard = ({ r, onView, onDelete }) => {
    const inits = initials(r.email || r.username);
    return (
        <div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
            <div className="flex items-start gap-3">
                {r.image ? (
                    <img
                        src={r.image}
                        alt={r.email || r.username}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
                    />
                ) : (
                    <div
                        className="h-8 w-8 shrink-0 rounded-full grid place-items-center text-[12px] font-semibold text-white ring-1 ring-black/5 dark:ring-white/10"
                        style={{ background: "linear-gradient(135deg, var(--primary-color), #059669)" }}
                    >
                        {inits}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-sm font-semibold">{r.email || "—"}</div>
                        <Badge variant={r.status === "pending" ? "secondary" : "default"} className="glass-badge">
                            {r.status}
                        </Badge>
                    </div>
                    <div className="truncate text-xs text-neutral-500">{r.id}</div>

                    <div className="mt-2 grid gap-1">
                        <div className="text-sm">{r.username || "—"}</div>
                        <div className="text-xs text-neutral-500">{r.phone || "—"}</div>
                        <div className="text-xs text-neutral-500 uppercase flex items-center gap-1">
                            {r.is_superuser ? <Shield className="h-3.5 w-3.5 text-emerald-600" /> : <UserCircle2 className="h-3.5 w-3.5 opacity-60" />}
                            {r.role || "ADMIN"}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => onView?.(r.id)} className="glass-button px-6 py-4 rounded-4xl">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete?.(r)}
                            className="glass-cta-danger px-6 py-4 rounded-4xl hover:bg-red-50 dark:hover:bg-red-950/20"
                            disabled={r.is_superuser}
                            title={r.is_superuser ? "Cannot delete superuser" : "Delete admin"}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminTable = ({ rows = [], loading = false, onDelete, onView }) => {
    const items = Array.isArray(rows) ? rows.map(normalize) : [];
    const empty = !loading && items.length === 0;

    return (
        <>
            {/* Mobile: Card list */}
            <div className="md:hidden">
                {loading && (
                    <div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50">
                        Loading admins…
                    </div>
                )}
                {empty && (
                    <div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50">
                        No admins found.
                    </div>
                )}
                {!loading &&
                    items.map((r) => (
                        <div key={r.id} className="mb-3">
                            <AdminCard r={r} onView={onView} onDelete={onDelete} />
                        </div>
                    ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-black/5 dark:ring-white/10">
                <Table className="table-glassy">
                    <TableHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:bg-neutral-900/50">
                        <TableRow className="border-0">
                            <TableHead className="min-w-[280px]">Admin</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Role / Status</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow className="border-0">
                                <TableCell colSpan={5} className="py-10 text-center text-sm text-neutral-500">
                                    Loading admins…
                                </TableCell>
                            </TableRow>
                        )}
                        {empty && (
                            <TableRow className="border-0">
                                <TableCell colSpan={5} className="py-10 text-center text-sm text-neutral-500">
                                    No admins found.
                                </TableCell>
                            </TableRow>
                        )}
                        {!loading &&
                            items.map((r) => (
                                <TableRow
                                    key={r.id}
                                    className="row-soft last:border-0 hover:bg-black/[0.025] dark:hover:bg-white/5 transition-colors"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {r.image ? (
                                                <img
                                                    src={r.image}
                                                    alt={r.email || r.username}
                                                    className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
                                                />
                                            ) : (
                                                <div
                                                    className="h-7 w-7 shrink-0 rounded-full grid place-items-center text-[12px] font-semibold text-white bg-gradient-to-br from-[var(--primary-color)] to-emerald-600 ring-1 ring-black/5 dark:ring-white/10"
                                                    aria-hidden
                                                    title={r.email || r.username}
                                                >
                                                    {initials(r.email || r.username)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{r.email || "—"}</div>
                                                <div className="truncate text-xs text-neutral-500">{r.id}</div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="text-sm">{r.username || "—"}</div>
                                        <div className="text-xs text-neutral-500">{r.phone || "—"}</div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {r.is_superuser ? (
                                                <Shield className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <UserCircle2 className="h-4 w-4 text-neutral-400" />
                                            )}
                                            <span className="text-xs uppercase tracking-wide">{r.role}</span>
                                            <Badge variant={r.status === "pending" ? "secondary" : "default"} className="glass-badge">
                                                {r.status}
                                            </Badge>
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="text-sm">
                                            {r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : "—"}
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            {r.created_at ? new Date(r.created_at).toISOString().slice(11, 16) : ""}
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="glass-menu">
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => onView?.(r.id)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-red-600 focus:text-red-700"
                                                    onClick={() => onDelete?.(r)}
                                                    disabled={r.is_superuser}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
};

export default AdminTable;
