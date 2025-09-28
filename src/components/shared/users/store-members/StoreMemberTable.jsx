import React from "react";
import { Eye, MoreHorizontal, Store, Trash2 } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(text = "") {
    const n = (text || "").trim();
    if (!n) return "M";
    if (n.includes("@")) return n[0].toUpperCase();
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "M";
    const b = (parts[1]?.[0] || n[1] || "").toUpperCase();
    return (a + b).toUpperCase();
}

function renderPerms(perms = []) {
    if (!Array.isArray(perms) || perms.length === 0) return "—";
    if (perms.length <= 2) return perms.join(", ");
    return `${perms.slice(0, 2).join(", ")} +${perms.length - 2}`;
}

const MemberCard = ({ r, onView, onDelete }) => {
    const u = r?.user || {};
    const s = r?.store || {};
    const title = u.email || u.username || "Member";
    const inits = initials(title);
    const roleBadge = r?.is_admin ? "Admin" : "Staff";

    return (
        <div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
            <div className="flex items-start gap-3">
                {u?.image_url ? (
                    <img
                        src={u.image_url}
                        alt={title}
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
                        <div className="truncate text-sm font-semibold">{title}</div>
                        <Badge variant={r?.status === "pending" ? "secondary" : "default"} className="glass-badge">
                            {r?.status || "active"}
                        </Badge>
                        <Badge variant={r?.is_admin ? "default" : "secondary"} className="glass-badge">
                            {roleBadge}
                        </Badge>
                    </div>
                    <div className="truncate text-xs text-neutral-500">{r?.id}</div>

                    <div className="mt-2 grid gap-1">
                        <div className="text-sm">{u?.email || "—"}</div>
                        <div className="text-xs text-neutral-500">{u?.phone_number || "—"}</div>
                        <div className="text-sm inline-flex items-center gap-2">
                            <Store className="h-3.5 w-3.5 opacity-70" />
                            <span className="truncate">{s?.name || "—"}</span>
                        </div>
                        <div className="text-xs text-neutral-500">
                            Permissions: {renderPerms(r?.permissions)}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => onView?.(r)} className="glass-button px-6 py-4 rounded-4xl">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete?.(r)}
                            className="glass-cta-danger px-6 py-4 rounded-4xl hover:bg-red-50 dark:hover:bg-red-950/20"
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

export default function StoreMemberTable({ rows = [], loading = false, onView, onDelete }) {
    const empty = !loading && (!rows || rows.length === 0);

    return (
        <>
            {/* Mobile: cards */}
            <div className="md:hidden">
                {loading && (
                    <div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50">
                        Loading members…
                    </div>
                )}
                {empty && (
                    <div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50">
                        No store members found.
                    </div>
                )}
                {!loading &&
                    rows?.map((r) => (
                        <div key={r.id} className="mb-3">
                            <MemberCard r={r} onView={onView} onDelete={onDelete} />
                        </div>
                    ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-black/5 dark:ring-white/10">
                <Table className="table-glassy">
                    <TableHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur dark:bg-neutral-900/50">
                        <TableRow className="border-0">
                            <TableHead className="min-w-[260px]">Member</TableHead>
                            <TableHead>Store</TableHead>
                            <TableHead className="text-right">Role</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                            <TableHead className="text-right">Perms</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow className="border-0">
                                <TableCell colSpan={7} className="py-10 text-center text-sm text-neutral-500">
                                    Loading members…
                                </TableCell>
                            </TableRow>
                        )}
                        {empty && (
                            <TableRow className="border-0">
                                <TableCell colSpan={7} className="py-10 text-center text-sm text-neutral-500">
                                    No store members found.
                                </TableCell>
                            </TableRow>
                        )}
                        {!loading &&
                            rows?.map((r) => {
                                const u = r?.user || {};
                                const s = r?.store || {};
                                const title = u.email || u.username || "Member";
                                const inits = initials(title);
                                return (
                                    <TableRow
                                        key={r.id}
                                        className="row-soft last:border-0 hover:bg-black/[0.025] dark:hover:bg-white/5 transition-colors"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {u?.image_url ? (
                                                    <img
                                                        src={u.image_url}
                                                        alt={title}
                                                        className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
                                                    />
                                                ) : (
                                                    <div
                                                        className="h-7 w-7 shrink-0 rounded-full grid place-items-center text-[12px] font-semibold text-white bg-gradient-to-br from-[var(--primary-color)] to-emerald-600 ring-1 ring-black/5 dark:ring-white/10"
                                                        aria-hidden
                                                        title={title}
                                                    >
                                                        {inits}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium">{title}</div>
                                                    <div className="truncate text-xs text-neutral-500">{r.id}</div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="text-sm">{s?.name || "—"}</div>
                                            <div className="text-xs text-neutral-500">{s?.id || "—"}</div>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Badge variant={r?.is_admin ? "default" : "secondary"} className="glass-badge">
                                                {r?.is_admin ? "Admin" : "Staff"}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Badge variant={r?.status === "pending" ? "secondary" : "default"} className="glass-badge">
                                                {r?.status || "active"}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <span className="text-xs text-neutral-600 dark:text-neutral-300">
                                                {renderPerms(r?.permissions)}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="text-sm">
                                                {r?.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : "—"}
                                            </div>
                                            <div className="text-xs text-neutral-500">
                                                {r?.created_at ? new Date(r.created_at).toISOString().slice(11, 16) : ""}
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
                                                    <DropdownMenuItem className="cursor-pointer" onClick={() => onView?.(r)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer text-red-600 focus:text-red-700"
                                                        onClick={() => onDelete?.(r)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
