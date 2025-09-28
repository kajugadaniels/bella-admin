import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCopy, Copy, ExternalLink, Mail, Phone, Shield, Store } from "lucide-react";
import { toast } from "sonner";
import { superadmin } from "@/api";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import StoreMemberDeleteDialog from "./StoreMemberDeleteDialog";

/* ----------------------------- utils ----------------------------- */
function initials(text = "") {
    const n = (text || "").trim();
    if (!n) return "M";
    if (n.includes("@")) return n[0].toUpperCase();
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "M";
    const b = (parts[1]?.[0] || n[1] || "").toUpperCase();
    return (a + b).toUpperCase();
}
const GlassCard = ({ className = "", children }) => (
    <div
        className={[
            "rounded-2xl border p-3",
            "border-neutral-200/80 bg-white/70 backdrop-blur-md",
            "dark:border-neutral-800 dark:bg-neutral-900/60",
            className,
        ].join(" ")}
    >
        {children}
    </div>
);
const InfoRow = ({ icon: Icon, label, value, href, copyable }) => {
    const content = (
        <div className="min-w-0 flex-1 truncate text-sm text-neutral-800 dark:text-neutral-200">
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
        <div className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5">
            <div className="h-8 w-8 grid place-items-center rounded-lg border border-neutral-200/80 bg-white/70 text-neutral-600 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300">
                <Icon className="h-4 w-4" />
            </div>
            <div className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
            {href ? (
                <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex-1 min-w-0">
                    <div className="group flex items-center gap-2">
                        {content}
                        <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                    </div>
                </a>
            ) : (
                content
            )}
            {copyable && value ? (
                <Button size="icon" variant="ghost" onClick={copy} className="h-8 w-8 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-100">
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

/* ---------------------------- component ---------------------------- */
export default function StoreMemberDetailSheet({ membershipId, open, onOpenChange, onDeleted }) {
    const [loading, setLoading] = useState(false);
    const [row, setRow] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const fetchDetail = useCallback(async () => {
        if (!open || !membershipId) return;
        setLoading(true);
        try {
            const res = await superadmin.getStoreMember(membershipId);
            const data = res?.data?.data || res?.data;
            setRow(data || null);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.detail ||
                err?.message ||
                "Unable to load member";
            toast.error(msg);
            setRow(null);
        } finally {
            setLoading(false);
        }
    }, [open, membershipId]);

    useEffect(() => {
        let ignore = false;
        (async () => {
            if (!open || !membershipId) return;
            if (!ignore) await fetchDetail();
        })();
        return () => {
            ignore = true;
        };
    }, [open, membershipId, fetchDetail]);

    const m = row || {};
    const id = m.id || m.membership_id || membershipId;
    const u = m.user || {};
    const s = m.store || {};
    const title = u.email || u.username || "Member";

    const avatar = useMemo(() => {
        if (u?.image_url) {
            return (
                <img
                    src={u.image_url}
                    alt={title}
                    className="h-14 w-14 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
                />
            );
        }
        return (
            <div
                className="grid h-14 w-14 place-items-center rounded-xl text-sm font-semibold text-white ring-1 ring-black/5 dark:ring-white/10"
                style={{ background: "linear-gradient(135deg, var(--primary-color), #059669)" }}
            >
                {initials(title)}
            </div>
        );
    }, [u, title]);

    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(String(id || ""));
            toast.success("Membership ID copied");
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
          border-l border-neutral-200 bg-white/90 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/85
        "
            >
                {/* Top banner */}
                <div className="h-20 w-full" style={{ background: "linear-gradient(90deg, var(--primary-color), #059669)" }} />
                {/* Header */}
                <div className="-mt-10 px-5 sm:px-6">
                    <GlassCard className="p-4">
                        <SheetHeader className="mb-1">
                            <SheetTitle className="sr-only">Store member details</SheetTitle>
                            {loading ? (
                                <HeaderSkeleton />
                            ) : (
                                <div className="flex flex-wrap items-center gap-3">
                                    {avatar}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-xl font-semibold">{title}</div>
                                        <SheetDescription className="truncate text-xs">{id || ""}</SheetDescription>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant={m?.is_admin ? "default" : "secondary"} className="glass-badge">
                                            {m?.is_admin ? "Admin" : "Staff"}
                                        </Badge>
                                        <Badge variant={m?.status === "pending" ? "secondary" : "default"} className="glass-badge">
                                            {m?.status || "active"}
                                        </Badge>

                                        <Button variant="outline" onClick={copyId} className="cursor-pointer px-6 py-4 rounded-4xl">
                                            <ClipboardCopy className="mr-2 h-4 w-4" />
                                            Copy ID
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            className="glass-button px-6 py-4 rounded-4xl"
                                            onClick={() => setConfirmDelete(true)}
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
                    <Separator className="my-4 border-neutral-200 dark:border-neutral-800" />

                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-28 w-full rounded-xl" />
                            <Skeleton className="h-28 w-full rounded-xl" />
                        </div>
                    ) : !id ? (
                        <div className="text-sm text-neutral-500">Member not found.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {/* LEFT: User */}
                            <GlassCard>
                                <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                                    <Shield className="h-4 w-4" />
                                    User
                                </div>
                                <div className="mt-2 space-y-1">
                                    <InfoRow icon={Mail} label="Email" value={u?.email} href={u?.email ? `mailto:${u.email}` : undefined} copyable />
                                    <InfoRow icon={Phone} label="Phone" value={u?.phone_number} href={u?.phone_number ? `tel:${u.phone_number}` : undefined} copyable />
                                    <InfoRow icon={Shield} label="Username" value={u?.username} copyable />
                                </div>
                            </GlassCard>

                            {/* RIGHT: Store */}
                            <GlassCard>
                                <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                                    <Store className="h-4 w-4" />
                                    Store
                                </div>
                                <div className="mt-2 space-y-1">
                                    <InfoRow icon={Store} label="Name" value={s?.name} copyable />
                                    <InfoRow icon={Store} label="Store ID" value={s?.id} copyable />
                                    <InfoRow
                                        icon={Shield}
                                        label="Created at"
                                        value={m?.created_at ? new Date(m.created_at).toLocaleString() : "—"}
                                    />
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>

                {/* Delete dialog */}
                <StoreMemberDeleteDialog
                    member={row}
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
