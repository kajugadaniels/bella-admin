import React, { useState } from "react";
import { Eye, MoreHorizontal, Pencil, Trash2, MapPin, UserPlus } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StoreStaffAddSheet from "./StoreStaffAddSheet";

function initials(name = "") {
    const n = (name || "").trim();
    if (!n) return "S";
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "S";
    const b = (parts[1]?.[0] || n[1] || "").toUpperCase();
    return (a + b).toUpperCase();
}

const StoreTable = ({ rows = [], loading = false, onEdit, onDelete, onView }) => {
    const empty = !loading && (!rows || rows.length === 0);
    const [addForStore, setAddForStore] = useState(null);

    /* ------------------------------ Card (mobile) ------------------------------ */
    const MobileCards = () => (
        <div className="md:hidden space-y-3">
            {loading && (
                <div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/60">
                    Loading stores…
                </div>
            )}

            {empty && (
                <div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/60">
                    No stores found.
                </div>
            )}

            {!loading &&
                rows?.map((r) => {
                    const inits = initials(r.name);
                    return (
                        <div
                            key={r.id}
                            className="glass-card p-4 ring-1 ring-black/5 dark:ring-white/10"
                        >
                            <div className="flex items-start gap-3">
                                {r.image ? (
                                    <img
                                        src={r.image}
                                        alt={r.name}
                                        className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
                                    />
                                ) : (
                                    <div
                                        className="grid h-10 w-10 place-items-center rounded-lg text-xs font-semibold text-white ring-1 ring-black/5 dark:ring-white/10"
                                        style={{ background: "linear-gradient(135deg, var(--primary-color), #059669)" }}
                                        aria-hidden
                                        title={r.name}
                                    >
                                        {inits}
                                    </div>
                                )}

                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium">{r.name}</div>
                                    <div className="truncate text-xs text-neutral-500">{r.id}</div>

                                    <div className="mt-2 grid gap-1 text-sm">
                                        <div className="truncate">{r.email || "—"}</div>
                                        <div className="truncate text-xs text-neutral-500">{r.phone_number || "—"}</div>
                                        <div className="truncate">{r.address || "—"}</div>
                                        <div className="truncate text-xs text-neutral-500">
                                            {[r.province, r.district, r.sector].filter(Boolean).join(" · ") || "—"}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <Badge variant={r.has_admin ? "default" : "secondary"} className="glass-badge">
                                            {r.has_admin ? "Has admin" : "No admin"}
                                        </Badge>
                                        <span className="text-sm tabular-nums">{r.staff_count ?? 0} staff</span>

                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="ml-auto px-0 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer"
                                            onClick={() => setAddForStore(r)}
                                        >
                                            <UserPlus className="mr-1 h-4 w-4" />
                                            Add staff
                                        </Button>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => onView?.(r.id)}>
                                            <Eye className="mr-1.5 h-4 w-4" />
                                            Details
                                        </Button>
                                        {r.map_url && (
                                            <a href={r.map_url} target="_blank" rel="noreferrer" className="contents">
                                                <Button variant="outline" size="sm">
                                                    <MapPin className="mr-1.5 h-4 w-4" />
                                                    Map
                                                </Button>
                                            </a>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => onEdit?.(r.id)}>
                                            <Pencil className="mr-1.5 h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => onDelete?.(r)}
                                            className="ml-auto"
                                        >
                                            <Trash2 className="mr-1.5 h-4 w-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
        </div>
    );

    /* ------------------------------- Table (md+) ------------------------------- */
    const DesktopTable = () => (
        <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-black/5 dark:ring-white/10">
            <Table className="table-glassy">
                <TableHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:bg-neutral-900/50">
                    <TableRow className="border-0">
                        <TableHead className="min-w-[260px]">Store</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Staff</TableHead>
                        <TableHead className="text-right">Created</TableHead>
                        <TableHead className="w-12" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && (
                        <TableRow className="border-0">
                            <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                                Loading stores…
                            </TableCell>
                        </TableRow>
                    )}
                    {empty && (
                        <TableRow className="border-0">
                            <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                                No stores found.
                            </TableCell>
                        </TableRow>
                    )}
                    {!loading &&
                        rows?.map((r) => {
                            const inits = initials(r.name);
                            return (
                                <TableRow
                                    key={r.id}
                                    className="row-soft last:border-0 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/5"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {r.image ? (
                                                <img
                                                    src={r.image}
                                                    alt={r.name}
                                                    className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
                                                />
                                            ) : (
                                                <div
                                                    className="h-7 w-7 shrink-0 grid place-items-center rounded-full text-[12px] font-semibold text-white ring-1 ring-black/5 dark:ring-white/10"
                                                    style={{ background: "linear-gradient(135deg, var(--primary-color), #059669)" }}
                                                    aria-hidden
                                                    title={r.name}
                                                >
                                                    {inits}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{r.name}</div>
                                                <div className="truncate text-xs text-neutral-500">{r.id}</div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="text-sm">{r.email || "—"}</div>
                                        <div className="text-xs text-neutral-500">{r.phone_number || "—"}</div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="truncate text-sm">{r.address || "—"}</div>
                                        <div className="truncate text-xs text-neutral-500">
                                            {[r.province, r.district, r.sector].filter(Boolean).join(" · ") || "—"}
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <Badge variant={r.has_admin ? "default" : "secondary"} className="glass-badge">
                                                {r.has_admin ? "Has admin" : "No admin"}
                                            </Badge>
                                            <span className="text-sm tabular-nums text-neutral-700 dark:text-neutral-300">
                                                {r.staff_count ?? 0}
                                            </span>

                                            {/* New: Add staff quick link */}
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="px-0 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                                                onClick={() => setAddForStore(r)}
                                                title="Add a staff member to this store"
                                            >
                                                <UserPlus className="mr-1 h-4 w-4" />
                                                Add staff
                                            </Button>
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
                                                {r.map_url && (
                                                    <a href={r.map_url} target="_blank" rel="noreferrer" className="contents">
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <MapPin className="mr-2 h-4 w-4" />
                                                            Open map
                                                        </DropdownMenuItem>
                                                    </a>
                                                )}
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => setAddForStore(r)}
                                                >
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Add staff
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit?.(r.id)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
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
    );

    return (
        <>
            <MobileCards />
            <DesktopTable />

            {/* Add Staff Sheet */}
            {addForStore && (
                <StoreStaffAddSheet
                    store={addForStore}
                    open={!!addForStore}
                    onOpenChange={(o) => {
                        if (!o) setAddForStore(null);
                    }}
                    onDone={() => {
                        setAddForStore(null);
                        // parent list can be refreshed externally; this keeps the UX smooth
                    }}
                />
            )}
        </>
    );
};

export default StoreTable;
