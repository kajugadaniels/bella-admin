import React, { useMemo } from "react";
import { MoreHorizontal, Pencil, Trash2, MapPin } from "lucide-react";
import { format } from "date-fns";

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
    const n = (name || "").trim();
    if (!n) return "S";
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "S";
    const b = (parts[1]?.[0] || n[1] || "").toUpperCase();
    return (a + b).toUpperCase();
}
function hue(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 360;
}

const StoreTable = ({ rows = [], loading = false, onEdit, onDelete }) => {
    const empty = !loading && (!rows || rows.length === 0);

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="min-w-[240px]">Store</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Staff</TableHead>
                        <TableHead className="text-right">Created</TableHead>
                        <TableHead className="w-12" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && (
                        <TableRow>
                            <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                                Loading stores…
                            </TableCell>
                        </TableRow>
                    )}
                    {empty && (
                        <TableRow>
                            <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                                No stores found.
                            </TableCell>
                        </TableRow>
                    )}
                    {!loading &&
                        rows?.map((r) => {
                            const inits = initials(r.name);
                            const gradient = `linear-gradient(135deg, hsl(${hue(r.name)} 75% 60%) 0%, hsl(${(hue(r.name) + 66) % 360} 75% 55%) 100%)`;
                            return (
                                <TableRow key={r.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {r.image ? (
                                                <img
                                                    src={r.image}
                                                    alt={r.name}
                                                    className="h-9 w-9 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
                                                />
                                            ) : (
                                                <div
                                                    className="h-9 w-9 select-none rounded-lg text-center text-xs font-semibold leading-9 text-white"
                                                    style={{ backgroundImage: gradient }}
                                                    aria-hidden
                                                >
                                                    {inits}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{r.name}</div>
                                                <div className="truncate text-xs text-neutral-500">
                                                    {r.id}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="text-sm">{r.email || "—"}</div>
                                        <div className="text-xs text-neutral-500">{r.phone_number || "—"}</div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="truncate text-sm">
                                            {r.address || "—"}
                                        </div>
                                        <div className="truncate text-xs text-neutral-500">
                                            {[r.province, r.district, r.sector].filter(Boolean).join(" · ") || "—"}
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <Badge variant={r.has_admin ? "default" : "secondary"}>
                                                {r.has_admin ? "Has admin" : "No admin"}
                                            </Badge>
                                            <span className="text-sm tabular-nums text-neutral-700 dark:text-neutral-300">
                                                {r.staff_count ?? 0}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="text-sm">
                                            {r.created_at ? format(new Date(r.created_at), "yyyy-MM-dd") : "—"}
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            {r.created_at ? format(new Date(r.created_at), "HH:mm") : ""}
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
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
    );
};

export default StoreTable;
