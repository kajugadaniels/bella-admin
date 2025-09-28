import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { superadmin } from "@/api";
import { toast } from "sonner";
import { Loader2, Mail, Phone, Shield } from "lucide-react";
import AdminDeleteDialog from "./AdminDeleteDialog";

function extractToastError(err, fallback = "Unable to load admin") {
    try {
        return err?.response?.data?.message || err?.message || fallback;
    } catch {
        return fallback;
    }
}

function KV({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4 py-1">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-right max-w-[70%] break-words">{value ?? "—"}</span>
        </div>
    );
}

export default function AdminDetailSheet({ adminId, open, onOpenChange, onDeleted }) {
    const [loading, setLoading] = useState(false);
    const [row, setRow] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (!open || !adminId) return;
        (async () => {
            setLoading(true);
            try {
                // Auto-detect default status server-side
                const res = await superadmin.getAdmin(adminId);
                const data = res?.data?.data || res?.data;
                setRow(data || null);
            } catch (err) {
                toast.error(extractToastError(err));
            } finally {
                setLoading(false);
            }
        })();
    }, [open, adminId]);

    const n = row || {};
    const user = n.user || n; // tolerate either shape

    const canDelete = !user?.is_superuser; // extra guard; backend also enforces 'no self / no superuser'

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle>Admin details</SheetTitle>
                    <SheetDescription>Profile and status of this administrator.</SheetDescription>
                </SheetHeader>

                <div className="mt-4 space-y-4">
                    {loading ? (
                        <div className="h-32 grid place-items-center">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : !user?.id ? (
                        <div className="text-sm text-muted-foreground">Admin not found.</div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                {user?.image_url ? (
                                    <img
                                        src={user.image_url}
                                        alt={user?.email || "Admin"}
                                        className="h-12 w-12 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
                                    />
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
                                        <Shield className="h-5 w-5 text-emerald-600" />
                                    </div>
                                )}
                                <div>
                                    <div className="font-semibold leading-tight">{user?.email}</div>
                                    <div className="text-xs text-muted-foreground">{user?.username}</div>
                                </div>
                                <div className="ml-auto">
                                    <Badge variant={n?.status === "pending" ? "secondary" : "default"}>
                                        {n?.status || "active"}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-1.5">
                                <KV label="Email" value={<span className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {user?.email || "—"}</span>} />
                                <KV label="Phone" value={<span className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {user?.phone_number || "—"}</span>} />
                                <KV label="Role" value={user?.role || "ADMIN"} />
                                {typeof user?.is_superuser === "boolean" && <KV label="Superuser" value={user.is_superuser ? "Yes" : "No"} />}
                                <KV label="Created at" value={n?.created_at ? new Date(n.created_at).toLocaleString() : "—"} />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <Button variant="outline" onClick={() => onOpenChange?.(false)} className="glass-button">Close</Button>
                                <Button
                                    variant="destructive"
                                    className="glass-button"
                                    onClick={() => setConfirmDelete(true)}
                                    disabled={!canDelete}
                                    title={canDelete ? "Delete admin" : "Cannot delete superuser"}
                                >
                                    Delete
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                <AdminDeleteDialog
                    admin={row}
                    open={confirmDelete}
                    onOpenChange={setConfirmDelete}
                    onDone={() => {
                        setConfirmDelete(false);
                        onOpenChange?.(false);
                        onDeleted?.();
                    }}
                />
            </SheetContent>
        </Sheet>
    );
}
