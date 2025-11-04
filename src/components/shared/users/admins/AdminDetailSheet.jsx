import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    ClipboardCopy,
    Copy,
    ExternalLink,
    Mail,
    Phone,
    Shield,
    ShieldCheck,
    UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { superadmin } from "@/api";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import AdminDeleteDialog from "./AdminDeleteDialog";

/* --------------------------------- utils -------------------------------- */
function initials(text = "") {
    const n = (text || "").trim();
    if (!n) return "A";
    if (n.includes("@")) return n[0].toUpperCase();
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "A";
    const b = (parts[1]?.[0] || n[1] || "").toUpperCase();
    return (a + b).toUpperCase();
}

const GlassCard = ({ className = "", children }) => (
    <div
        className={[
            "rounded-2xl border p-3",
            "border-neutral-200/80 bg-white/70 backdrop-blur-md",
            className,
        ].join(" ")}
    >
        {children}
    </div>
);

const InfoRow = ({ icon, label, value, href, copyable }) => {
    const content = (
        <div className="min-w-0 flex-1 truncate text-sm text-neutral-800">
            {value ?? "—"}
        </div>
    );

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(String(value ?? ""));
            toast.success(`${label} copied`);
        } catch {
            toast.error("Could not copy");
        }
    };

    return (
        <div className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-black/[0.03]">
            <div className="h-8 w-8 grid place-items-center rounded-lg border border-neutral-200/80 bg-white/70 text-neutral-600 backdrop-blur-sm">
                {icon && <icon className="h-4 w-4" />}
            </div>
            <div className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {label}
            </div>
            {href ? (
                <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="flex-1 min-w-0"
                >
                    <div className="group flex items-center gap-2">
                        {content}
                        <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                    </div>
                </a>
            ) : (
                content
            )}
            {copyable && value ? (
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={copy}
                    className="h-8 w-8 text-neutral-500 hover:text-neutral-800"
                >
                    <Copy className="h-4 w-4" />
                </Button>
            ) : null}
        </div>
    );
};

const HeaderSkeleton = () => (
    <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
    </div>
);

/* ------------------------------- component ------------------------------- */
export default function AdminDetailSheet({ adminId, open, onOpenChange, onDeleted }) {
    const [loading, setLoading] = useState(false);
    const [payload, setPayload] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const fetchAdmin = useCallback(async () => {
        if (!open || !adminId) return;
        setLoading(true);
        try {
            // Server auto-detects status (active/pending)
            const res = await superadmin.getAdmin(adminId);
            const data = res?.data?.data || res?.data;
            setPayload(data || null);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.detail ||
                err?.message ||
                "Unable to load admin";
            toast.error(msg);
            setPayload(null);
        } finally {
            setLoading(false);
        }
    }, [open, adminId]);

    useEffect(() => {
        let ignore = false;
        (async () => {
            if (!open || !adminId) return;
            if (!ignore) await fetchAdmin();
        })();
        return () => {
            ignore = true;
        };
    }, [open, adminId, fetchAdmin]);

    // tolerate both shapes: { user, status } OR the user directly
    const n = payload || {};
    const user = n.user || n;

    const avatar = useMemo(() => {
        const text = user?.email || user?.username || "Admin";
        if (user?.image_url || user?.image) {
            return (
                <img
                    src={user.image_url || user.image}
                    alt={text}
                    className="h-10 w-10 rounded-xl object-cover ring-1 ring-black/5"
                />
            );
        }
        return (
            <div
                className="grid h-10 w-10 place-items-center rounded-4xl text-sm font-semibold text-white ring-1 ring-black/5"
                style={{ background: "linear-gradient(135deg, var(--primary-color), #059669)" }}
            >
                {initials(text)}
            </div>
        );
    }, [user]);

    const canDelete = !user?.is_superuser; // backend also enforces no self / no superuser

    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(String(user?.id || n?.id || adminId || ""));
            toast.success("Admin ID copied");
        } catch {
            toast.error("Could not copy ID");
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="
          p-0 
          w-[min(980px,100vw)] sm:max-w-[980px]
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right
          border-l border-neutral-200 bg-white/90 backdrop-blur-xl
        "
            >
                {/* Top banner */}
                <div
                    className="h-20 w-full"
                    style={{ background: "linear-gradient(90deg, var(--primary-color), #059669)" }}
                />
                {/* Header */}
                <div className="-mt-10 px-5 sm:px-6">
                    <GlassCard className="p-4">
                        <SheetHeader className="mb-1">
                            <SheetTitle className="sr-only">Admin details</SheetTitle>
                            {loading ? (
                                <HeaderSkeleton />
                            ) : (
                                <div className="flex flex-wrap items-center gap-3">
                                    {avatar}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-lg font-semibold">
                                            {user?.email || user?.username || "Admin details"}
                                        </div>
                                        <SheetDescription className="truncate text-xs">
                                            {user?.id || n?.id || adminId || ""}
                                        </SheetDescription>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant={(n?.status || "active") === "pending" ? "secondary" : "default"}
                                            className="glass-badge"
                                        >
                                            {n?.status || "active"}
                                        </Badge>

                                        <Button
                                            variant="outline"
                                            onClick={copyId}
                                            className="cursor-pointer px-6 py-4 rounded-4xl"
                                        >
                                            <ClipboardCopy className="mr-2 h-4 w-4" />
                                            Copy ID
                                        </Button>

                                        {user?.email && (
                                            <a href={`mailto:${user.email}`} className="contents">
                                                <Button variant="outline" className="cursor-pointer px-6 py-4 rounded-4xl">
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    Email
                                                </Button>
                                            </a>
                                        )}
                                        {user?.phone_number && (
                                            <a href={`tel:${user.phone_number}`} className="contents">
                                                <Button variant="outline" className="cursor-pointer px-6 py-4 rounded-4xl">
                                                    <Phone className="mr-2 h-4 w-4" />
                                                    Call
                                                </Button>
                                            </a>
                                        )}

                                        <Button
                                            variant="destructive"
                                            className="glass-cta-danger px-6 py-4 rounded-4xl"
                                            onClick={() => setConfirmDelete(true)}
                                            disabled={!canDelete}
                                            title={canDelete ? "Delete admin" : "Cannot delete superuser"}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </SheetHeader>
                    </GlassCard>
                </div>

                {/* Body */}
                <div className="px-5 pb-6 pt-4 sm:px-6">
                    <Separator className="my-4 border-neutral-200" />

                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-28 w-full rounded-xl" />
                            <Skeleton className="h-28 w-full rounded-xl" />
                        </div>
                    ) : !user?.id && !n?.id ? (
                        <div className="text-sm text-neutral-500">Admin not found.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {/* LEFT: Contact */}
                            <GlassCard>
                                <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                    <UserCircle2 className="h-4 w-4" />
                                    Profile & Contact
                                </div>
                                <div className="mt-2 space-y-1">
                                    <InfoRow
                                        icon={Mail}
                                        label="Email"
                                        value={user?.email}
                                        href={user?.email ? `mailto:${user.email}` : undefined}
                                        copyable
                                    />
                                    <InfoRow
                                        icon={UserCircle2}
                                        label="Username"
                                        value={user?.username}
                                        copyable
                                    />
                                    <InfoRow
                                        icon={Phone}
                                        label="Phone"
                                        value={user?.phone_number}
                                        href={user?.phone_number ? `tel:${user.phone_number}` : undefined}
                                        copyable
                                    />
                                </div>
                            </GlassCard>

                            {/* RIGHT: Security / Meta */}
                            <GlassCard>
                                <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                    <ShieldCheck className="h-4 w-4" />
                                    Security & Meta
                                </div>
                                <div className="mt-2 space-y-1">
                                    <InfoRow
                                        icon={Shield}
                                        label="Role"
                                        value={user?.role || "ADMIN"}
                                        copyable
                                    />
                                    {typeof user?.is_superuser === "boolean" && (
                                        <InfoRow
                                            icon={Shield}
                                            label="Superuser"
                                            value={user.is_superuser ? "Yes" : "No"}
                                        />
                                    )}
                                    <InfoRow
                                        icon={Shield}
                                        label="Status"
                                        value={n?.status || "active"}
                                    />
                                    <InfoRow
                                        icon={Shield}
                                        label="Created at"
                                        value={
                                            n?.created_at
                                                ? new Date(n.created_at).toLocaleString()
                                                : user?.created_at
                                                    ? new Date(user.created_at).toLocaleString()
                                                    : "—"
                                        }
                                    />
                                    {user?.last_login && (
                                        <InfoRow
                                            icon={Shield}
                                            label="Last login"
                                            value={new Date(user.last_login).toLocaleString()}
                                        />
                                    )}
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>

                {/* Delete dialog */}
                <AdminDeleteDialog
                    admin={payload}
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
