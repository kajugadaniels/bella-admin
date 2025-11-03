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
import StoreAddStaffSheet from "./StoreAddStaffSheet";

function initials(name = "") {
    const n = (name || "").trim();
    if (!n) return "S";
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "S";
    const b = (parts[1]?.[0] || n[1] || "").toUpperCase();
    return (a + b).toUpperCase();
}

const StoreCard = ({ r, onView, onEdit, onDelete, onAddStaff }) => {
    const inits = initials(r.name);
    return (
        <div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur">
            <div className="flex items-start gap-3">
                {r.image ? (
                    <img
                        src={r.image}
                        alt={r.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-black/5"
                    />
                ) : (
                    <div
                        className="h-8 w-8 shrink-0 rounded-full grid place-items-center text-[12px] font-semibold text-white ring-1 ring-black/5"
                        style={{ background: "linear-gradient(135deg, var(--primary-color), #059669)" }}
                    >
                        {inits}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-sm font-semibold">{r.name}</div>
                        <Badge variant={r.has_admin ? "default" : "secondary"} className="glass-badge">
                            {r.has_admin ? "Has admin" : "No admin"}
                        </Badge>
                    </div>
                    <div className="truncate text-xs text-neutral-500">{r.id}</div>

                    <div className="mt-2 grid gap-1">
                        <div className="text-sm">{r.email || "—"}</div>
                        <div className="text-xs text-neutral-500">{r.phone_number || "—"}</div>
                        <div className="text-sm">{r.address || "—"}</div>
                        <div className="text-xs text-neutral-500">
                            {[r.province, r.district, r.sector].filter(Boolean).join(" · ") || "—"}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {r.map_url && (
                            <a href={r.map_url} target="_blank" rel="noreferrer" className="contents">
                                <Button variant="outline" size="sm" className="glass-button px-6 py-4 rounded-4xl">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Map
                                </Button>
                            </a>
                        )}
                        <Button variant="outline" size="sm" onClick={() => onView?.(r.id)} className="glass-button px-6 py-4 rounded-4xl">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onEdit?.(r.id)} className="glass-button px-6 py-4 rounded-4xl">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <Button size="sm" onClick={() => onAddStaff?.(r)} className="glass-cta px-6 py-4 rounded-4xl">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add staff
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete?.(r)}
                            className="glass-cta-danger px-6 py-4 rounded-4xl hover:bg-red-50"
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

const StoreTable = ({ rows = [], loading = false, onEdit, onDelete, onView, onStaffAdded }) => {
    const empty = !loading && (!rows || rows.length === 0);
    const [addStaffFor, setAddStaffFor] = useState(null);

    return (
        <>
            {/* Mobile: Card list */}
            <div className="md:hidden">
                {loading && (
                    <div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500">
                        Loading stores…
                    </div>
                )}
                {empty && (
                    <div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500">
                        No stores found.
                    </div>
                )}
                {!loading && rows?.map((r) => (
                    <div key={r.id} className="mb-3">
                        <StoreCard
                            r={r}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddStaff={(row) => setAddStaffFor(row)}
                        />
                    </div>
                ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-black/5">
                <Table className="table-glassy">
                    <TableHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
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
                                        className="row-soft last:border-0 hover:bg-black/[0.025] transition-colors"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {r.image ? (
                                                    <img
                                                        src={r.image}
                                                        alt={r.name}
                                                        className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-black/5"
                                                    />
                                                ) : (
                                                    <div
                                                        className="h-7 w-7 shrink-0 rounded-full grid place-items-center text-[12px] font-semibold text-white bg-gradient-to-br from-[var(--primary-color)] to-emerald-600 ring-1 ring-black/5"
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
                                                <span className="text-sm tabular-nums text-neutral-700">
                                                    {r.staff_count ?? 0}
                                                </span>
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

                                                    {/* Add staff action */}
                                                    <DropdownMenuItem className="cursor-pointer" onClick={() => setAddStaffFor(r)}>
                                                        <UserPlus className="mr-2 h-4 w-4" />
                                                        Add staff
                                                    </DropdownMenuItem>

                                                    {r.map_url && (
                                                        <a href={r.map_url} target="_blank" rel="noreferrer">
                                                            <DropdownMenuItem className="cursor-pointer">
                                                                <MapPin className="mr-2 h-4 w-4" />
                                                                Open map
                                                            </DropdownMenuItem>
                                                        </a>
                                                    )}

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

            {/* Add staff sheet */}
            {addStaffFor && (
                <StoreAddStaffSheet
                    store={addStaffFor}
                    open={!!addStaffFor}
                    onOpenChange={(o) => {
                        if (!o) setAddStaffFor(null);
                    }}
                    onDone={() => {
                        setAddStaffFor(null);
                        onStaffAdded?.();
                    }}
                />
            )}
        </>
    );
};

export default StoreTable;
