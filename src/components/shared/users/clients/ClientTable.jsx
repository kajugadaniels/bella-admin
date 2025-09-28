import React from "react";
import { Eye, MoreHorizontal, Trash2, Shield } from "lucide-react";
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
    if (!n) return "C";
    if (n.includes("@")) return n[0].toUpperCase();
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "C";
    const b = (parts[1]?.[0] || n[1] || "").toUpperCase();
    return (a + b).toUpperCase();
}

const ClientCard = ({ r, onView, onDelete }) => {
    const title = r?.email || r?.username || "Client";
    const inits = initials(title);
    return (
        <div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
            <div className="flex items-start gap-3">
                {r.image_url ? (
                    <img
                        src={r.image_url}
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
                    </div>
                    <div className="truncate text-xs text-neutral-500">{r?.id}</div>

                    <div className="mt-2 grid gap-1">
                        <div className="text-sm">{r?.email || "—"}</div>
                        <div className="text-xs text-neutral-500">{r?.phone_number || "—"}</div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView?.(r)}
                            className="glass-button px-6 py-4 rounded-4xl"
                        >
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

const ClientTable = ({ rows = [], loading = false, onView, onDelete }) => {
    const empty = !loading && (!rows || rows.length === 0);

    return (
        <>
            {/* Mobile: Card list */}
            <div className="md:hidden">
                {loading && (
                    <div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50">
                        Loading clients…
                    </div>
                )}
                {empty && (
                    <div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50">
                        No clients found.
                    </div>
                )}
                {!loading &&
                    rows?.map((r) => (
                        <div key={r.id || r.client_id} className="mb-3">
                            <ClientCard r={r} onView={onView} onDelete={onDelete} />
                        </div>
                    ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-black/5 dark:ring-white/10">
                <Table className="table-glassy">
                    <TableHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur dark:bg-neutral-900/50">
                        <TableRow className="border-0">
                            <TableHead className="min-w-[260px]">Client</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow className="border-0">
                                <TableCell colSpan={5} className="py-10 text-center text-sm text-neutral-500">
                                    Loading clients…
                                </TableCell>
                            </TableRow>
                        )}
                        {empty && (
                            <TableRow className="border-0">
                                <TableCell colSpan={5} className="py-10 text-center text-sm text-neutral-500">
                                    No clients found.
                                </TableCell>
                            </TableRow>
                        )}
                        {!loading &&
                            rows?.map((r) => {
                                const title = r?.email || r?.username || "Client";
                                const inits = initials(title);
                                return (
                                    <TableRow
                                        key={r.id || r.client_id}
                                        className="row-soft last:border-0 hover:bg-black/[0.025] dark:hover:bg-white/5 transition-colors"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {r.image_url ? (
                                                    <img
                                                        src={r.image_url}
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
                                            <div className="text-sm">{r.email || "—"}</div>
                                            <div className="text-xs text-neutral-500">{r.phone_number || "—"}</div>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Badge variant={r?.status === "pending" ? "secondary" : "default"} className="glass-badge">
                                                {r?.status || "active"}
                                            </Badge>
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
};

export default ClientTable;
