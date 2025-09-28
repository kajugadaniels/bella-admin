import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { MoreHorizontal, Eye, Trash2, Shield, UserCircle2 } from "lucide-react";

function getInitials(nameOrEmail) {
    const s = String(nameOrEmail || "").trim();
    if (!s) return "A";
    if (s.includes("@")) return s.slice(0, 1).toUpperCase();
    const parts = s.split(/\s+/);
    return (parts[0]?.[0] || "A").toUpperCase() + (parts[1]?.[0] || "");
}

function AdminAvatar({ image, label }) {
    if (image) {
        return (
            <img
                src={image}
                alt={label || "Admin"}
                className="h-9 w-9 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
            />
        );
    }
    return (
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
            <span className="text-xs font-semibold">{getInitials(label)}</span>
        </div>
    );
}

function normalizeRow(row) {
    // Supports both active & pending shapes defensively
    return {
        id: row?.id || row?.user_id || row?.admin_id || null,
        email: row?.email || row?.user?.email || "",
        username: row?.username || row?.user?.username || "",
        phone: row?.phone_number || row?.user?.phone_number || "",
        status: row?.status || "active",
        role: row?.role || row?.user?.role || "ADMIN",
        created_at: row?.created_at,
        image: row?.image || row?.user?.image_url || row?.user?.image || null,
        is_superuser: !!(row?.is_superuser ?? row?.user?.is_superuser),
    };
}

export default function AdminTable({ rows = [], loading, onView, onDelete, pagination }) {
    const items = Array.isArray(rows) ? rows.map(normalizeRow) : [];

    return (
        <div className="space-y-3">
            {/* Desktop table */}
            <div className="hidden lg:block rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 bg-background/50 backdrop-blur">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[56px]"></TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    Loading…
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No admins found
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <AdminAvatar image={row.image} label={row.email || row.username} />
                                    </TableCell>
                                    <TableCell className="font-medium">{row.email}</TableCell>
                                    <TableCell>{row.username}</TableCell>
                                    <TableCell>{row.phone}</TableCell>
                                    <TableCell>
                                        <Badge variant={row.status === "pending" ? "secondary" : "default"}>
                                            {row.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="flex items-center gap-1">
                                        {row.is_superuser ? <Shield className="h-4 w-4 text-emerald-600" /> : <UserCircle2 className="h-4 w-4 text-muted-foreground" />}
                                        <span className="uppercase text-xs tracking-wide">{row.role}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex gap-2">
                                            <Button size="sm" variant="outline" className="glass-button" onClick={() => onView(row)}>
                                                <Eye className="h-4 w-4" />
                                                <span className="ml-2">View</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="glass-button"
                                                onClick={() => onDelete(row)}
                                                disabled={row.is_superuser}
                                                title={row.is_superuser ? "Cannot delete superuser" : "Delete admin"}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="ml-2">Delete</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 lg:hidden">
                {loading ? (
                    <Card className="p-4 text-sm text-muted-foreground">Loading…</Card>
                ) : items.length === 0 ? (
                    <Card className="p-4 text-sm text-muted-foreground">No admins found</Card>
                ) : (
                    items.map((row) => (
                        <Card key={row.id} className="p-4 glass-card ring-1 ring-black/5 dark:ring-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AdminAvatar image={row.image} label={row.email || row.username} />
                                    <div>
                                        <div className="font-medium">{row.email}</div>
                                        <div className="text-xs text-muted-foreground">{row.username}</div>
                                    </div>
                                </div>
                                <Badge>{row.status}</Badge>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">{row.phone || "—"}</div>
                                <div className="inline-flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => onView(row)} className="glass-button">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => onDelete(row)}
                                        className="glass-button"
                                        disabled={row.is_superuser}
                                        title={row.is_superuser ? "Cannot delete superuser" : "Delete admin"}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Paginator */}
            <div className="flex items-center justify-end gap-2 pt-2">
                <span className="text-xs text-muted-foreground">Total: {pagination?.count ?? 0}</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pagination?.setPage?.((p) => Math.max(1, p - 1))}
                    disabled={!pagination?.hasPrev}
                    className="glass-button"
                >
                    Prev
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pagination?.setPage?.((p) => p + 1)}
                    disabled={!pagination?.hasNext}
                    className="glass-button"
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
