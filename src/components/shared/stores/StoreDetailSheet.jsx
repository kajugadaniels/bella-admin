import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Activity,
    ClipboardCopy,
    Copy,
    ExternalLink,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Users,
    Building2,
    CircleAlert,
    UserPlus,
    UserMinus,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

import StoreAddStaffSheet from "./StoreAddStaffSheet";

/* --------------------------------- utils -------------------------------- */
function initials(name = "") {
    const n = (name || "").trim();
    if (!n) return "S";
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "S";
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

const StatChip = ({ icon: Icon, label, value, hint }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white/70 p-3 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/60">
        <div
            className="grid h-10 w-10 place-items-center rounded-xl text-white ring-1 ring-black/5 dark:ring-white/10"
            style={{ background: "linear-gradient(135deg, var(--primary-color), #059669)" }}
        >
            <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-lg font-semibold tabular-nums">{value ?? 0}</div>
                {hint ? <div className="truncate text-xs text-neutral-500">{hint}</div> : null}
            </div>
        </div>
    </div>
);

const InfoRow = ({ icon: Icon, label, value, href, copyable }) => {
    const content = (
        <div className="min-w-0 flex-1 truncate text-sm text-neutral-800 dark:text-neutral-200">
            {value || "—"}
        </div>
    );

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value || "");
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
                    className="h-8 w-8 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-100"
                >
                    <Copy className="h-4 w-4" />
                </Button>
            ) : null}
        </div>
    );
};

const MiniUserRow = ({ user, right }) => {
    if (!user) return null;
    const text = user.username || user.email || "User";
    const inits = initials(text);
    return (
        <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5">
            <div
                className="h-8 w-8 shrink-0 grid place-items-center rounded-full text-[12px] font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--primary-color), #059669)" }}
            >
                {inits}
            </div>
            <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user.username || "—"}</div>
                <div className="truncate text-xs text-neutral-500">{user.email || "—"}</div>
            </div>
            {right ? <div className="ml-auto">{right}</div> : null}
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

/* -------------------------- Remove staff dialog -------------------------- */
function StaffRemoveDialog({
    open,
    onOpenChange,
    onConfirm,
    member,
    submitting,
    allowLastAdmin,
    onToggleAllowLastAdmin,
}) {
    const name = member?.user?.username || member?.user?.email || "this member";
    const isAdmin = !!member?.is_admin;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="glass-dialog w-[min(520px,calc(100vw-1rem))] rounded-2xl border border-black/5 bg-white/85 p-0 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/85">
                <div className="rounded-t-2xl bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 p-4 text-white">
                    <AlertDialogTitle className="flex items-center gap-2 text-base font-semibold">
                        <UserMinus className="h-4 w-4" />
                        Remove staff member?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-1 text-white/90">
                        This will detach <strong className="font-semibold">{name}</strong> from this store.
                    </AlertDialogDescription>
                </div>

                <div className="space-y-3 p-4">
                    <div className="rounded-xl border border-black/5 bg-white/70 p-3 text-sm text-neutral-700 dark:border-white/10 dark:bg-neutral-900/60 dark:text-neutral-300">
                        The removal is immediate and cannot be undone. {isAdmin ? "They are an admin." : "They are a staff member."}
                    </div>

                    {isAdmin && (
                        <label className="flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50/80 p-3 text-amber-800 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200">
                            <Checkbox
                                checked={!!allowLastAdmin}
                                onCheckedChange={onToggleAllowLastAdmin}
                                className="mt-0.5"
                            />
                            <span className="text-sm">
                                Allow removing even if this is the <span className="font-semibold">last admin</span>.
                                Use with caution.
                            </span>
                        </label>
                    )}
                </div>

                <AlertDialogFooter className="flex items-center justify-end gap-2 border-t border-black/5 bg-white/80 p-3 dark:border-white/10 dark:bg-neutral-900/60">
                    <AlertDialogCancel disabled={submitting} className="cursor-pointer">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={submitting}
                        onClick={onConfirm}
                        className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                    >
                        {submitting ? "Removing…" : "Remove"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/* -------------------------------- component ------------------------------- */
const StoreDetailSheet = ({ id, open, onOpenChange }) => {
    const [loading, setLoading] = useState(false);
    const [payload, setPayload] = useState(null);

    const [addOpen, setAddOpen] = useState(false);

    const [removeOpen, setRemoveOpen] = useState(false);
    const [removeTarget, setRemoveTarget] = useState(null); // { id, user:{}, is_admin }
    const [removeSubmitting, setRemoveSubmitting] = useState(false);
    const [allowLastAdmin, setAllowLastAdmin] = useState(false);

    const fetchDetails = useCallback(
        async (announce = false) => {
            if (!open || !id) return;
            setLoading(true);
            try {
                const { data, message } = await superadmin.getStore(id);
                setPayload(data?.data || null);
                if (announce && message) toast.success(message);
            } catch (err) {
                toast.error(err?.message || "Failed to fetch store details.");
                setPayload(null);
            } finally {
                setLoading(false);
            }
        },
        [id, open]
    );

    useEffect(() => {
        let ignore = false;
        (async () => {
            if (!open || !id) return;
            if (!ignore) await fetchDetails(false);
        })();
        return () => {
            ignore = true;
        };
    }, [id, open, fetchDetails]);

    const stats = payload?.stats || {};
    const location = payload?.location || {};
    const contact = payload?.contact || {};

    const counts = useMemo(
        () => ({
            admins: Array.isArray(payload?.admins) ? payload.admins.length : 0,
            staff: Array.isArray(payload?.staff) ? payload.staff.length : 0,
            pending: Array.isArray(payload?.pending_staff) ? payload.pending_staff.length : 0,
        }),
        [payload]
    );

    const avatar = useMemo(() => {
        if (!payload) return null;
        if (payload.image) {
            return (
                <img
                    src={payload.image}
                    alt={payload.name}
                    className="h-14 w-14 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
                />
            );
        }
        return (
            <div
                className="grid h-14 w-14 place-items-center rounded-xl text-sm font-semibold text-white ring-1 ring-black/5 dark:ring-white/10"
                style={{ background: "linear-gradient(135deg, var(--primary-color), #059669)" }}
            >
                {initials(payload.name)}
            </div>
        );
    }, [payload]);

    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(payload?.id || "");
            toast.success("Store ID copied");
        } catch {
            toast.error("Could not copy ID");
        }
    };

    const openRemove = (member, isAdmin) => {
        setRemoveTarget({ ...member, is_admin: !!isAdmin });
        setAllowLastAdmin(false);
        setRemoveOpen(true);
    };

    const confirmRemove = async () => {
        if (!removeTarget?.id) return;
        try {
            setRemoveSubmitting(true);
            await superadmin.removeStoreStaff(id, removeTarget.id, { allow_last_admin: !!allowLastAdmin });
            toast.success("Member removed.");
            setRemoveOpen(false);
            setRemoveTarget(null);
            await fetchDetails(false);
        } catch (err) {
            toast.error(err?.message || "Failed to remove member.");
        } finally {
            setRemoveSubmitting(false);
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
                <div
                    className="h-20 w-full"
                    style={{ background: "linear-gradient(90deg, var(--primary-color), #059669)" }}
                />
                {/* Header */}
                <div className="-mt-10 px-5 sm:px-6">
                    <GlassCard className="p-4">
                        <SheetHeader className="mb-1">
                            <SheetTitle className="sr-only">Store details</SheetTitle>
                            {loading ? (
                                <HeaderSkeleton />
                            ) : (
                                <div className="flex flex-wrap items-center gap-3">
                                    {avatar}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-xl font-semibold">
                                            {payload?.name || "Store details"}
                                        </div>
                                        <SheetDescription className="truncate text-xs">
                                            {payload?.id || ""}
                                        </SheetDescription>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={copyId} className="cursor-pointer">
                                            <ClipboardCopy className="mr-2 h-4 w-4" />
                                            Copy ID
                                        </Button>

                                        {/* Add staff action */}
                                        <Button
                                            size="sm"
                                            onClick={() => setAddOpen(true)}
                                            className="cursor-pointer text-white"
                                            style={{ background: "var(--primary-color)" }}
                                        >
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Add staff
                                        </Button>

                                        {contact.email && (
                                            <a href={`mailto:${contact.email}`} className="contents">
                                                <Button variant="outline" size="sm" className="cursor-pointer">
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    Email
                                                </Button>
                                            </a>
                                        )}
                                        {contact.phone_number && (
                                            <a href={`tel:${contact.phone_number}`} className="contents">
                                                <Button variant="outline" size="sm" className="cursor-pointer">
                                                    <Phone className="mr-2 h-4 w-4" />
                                                    Call
                                                </Button>
                                            </a>
                                        )}
                                        {location?.map_url && (
                                            <a
                                                href={location.map_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="contents"
                                            >
                                                <Button
                                                    size="sm"
                                                    className="cursor-pointer text-white"
                                                    style={{ background: "var(--primary-color)" }}
                                                >
                                                    <MapPin className="mr-2 h-4 w-4" />
                                                    Open map
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </SheetHeader>
                    </GlassCard>
                </div>

                {/* Body */}
                <div className="px-5 pb-6 pt-4 sm:px-6">
                    <Separator className="my-4 border-neutral-200 dark:border-neutral-800" />

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {/* LEFT: Info + stats */}
                        <div className="space-y-4 lg:col-span-1">
                            <GlassCard>
                                <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                                    <Building2 className="h-4 w-4" />
                                    Contact
                                </div>
                                <div className="mt-2 space-y-1">
                                    <InfoRow
                                        icon={Mail}
                                        label="Email"
                                        value={contact.email}
                                        href={contact.email ? `mailto:${contact.email}` : undefined}
                                        copyable
                                    />
                                    <InfoRow
                                        icon={Phone}
                                        label="Phone"
                                        value={contact.phone_number}
                                        href={contact.phone_number ? `tel:${contact.phone_number}` : undefined}
                                        copyable
                                    />
                                    <InfoRow icon={Building2} label="Address" value={contact.address} copyable />
                                </div>
                            </GlassCard>

                            <GlassCard>
                                <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                                    <MapPin className="h-4 w-4" />
                                    Location
                                </div>
                                <div className="mt-2 space-y-1">
                                    <InfoRow icon={MapPin} label="Province" value={location.province} />
                                    <InfoRow icon={MapPin} label="District" value={location.district} />
                                    <InfoRow icon={MapPin} label="Sector" value={location.sector} />
                                    <InfoRow
                                        icon={MapPin}
                                        label="Cell/Village"
                                        value={[location.cell, location.village].filter(Boolean).join(" / ")}
                                    />
                                    <InfoRow
                                        icon={ExternalLink}
                                        label="Map URL"
                                        value={location.map_url}
                                        href={location.map_url}
                                        copyable
                                    />
                                </div>
                            </GlassCard>

                            <div className="grid grid-cols-2 gap-3">
                                <StatChip icon={Users} label="Staff" value={stats.staff_count} hint="Total team" />
                                <StatChip icon={ShieldCheck} label="Admins" value={stats.admin_count} hint="Managers" />
                                <StatChip icon={Activity} label="Active" value={stats.active_staff} hint="This period" />
                                <StatChip icon={Activity} label="Pending" value={stats.pending_invites} hint="Invites" />
                            </div>
                        </div>

                        {/* RIGHT: Tabs */}
                        <div className="lg:col-span-2">
                            <Tabs defaultValue="admins" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-neutral-200/80 bg-white/70 p-1 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/60">
                                    <TabsTrigger
                                        value="admins"
                                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-900"
                                    >
                                        Admins
                                        <Badge variant="secondary" className="ml-2">
                                            {counts.admins}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="staff"
                                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-900"
                                    >
                                        Staff
                                        <Badge variant="secondary" className="ml-2">
                                            {counts.staff}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="pending"
                                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-900"
                                    >
                                        Pending
                                        <Badge variant="secondary" className="ml-2">
                                            {counts.pending}
                                        </Badge>
                                    </TabsTrigger>
                                </TabsList>

                                {/* Admins */}
                                <TabsContent value="admins" className="mt-3">
                                    <GlassCard className="p-0">
                                        <ScrollArea className="max-h-[56vh] pr-2">
                                            {loading && (
                                                <div className="space-y-2 p-3">
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                </div>
                                            )}
                                            {!loading && (!payload?.admins || payload.admins.length === 0) && (
                                                <div className="flex items-center gap-2 p-5 text-sm text-neutral-500">
                                                    <CircleAlert className="h-4 w-4" />
                                                    No admins yet.
                                                </div>
                                            )}
                                            {!loading &&
                                                payload?.admins?.map((m) => (
                                                    <MiniUserRow
                                                        key={m.id}
                                                        user={m.user}
                                                        right={
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="default" className="glass-badge">
                                                                    Admin
                                                                </Badge>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => openRemove(m, true)}
                                                                    className="text-red-600 hover:text-red-700 cursor-pointer"
                                                                >
                                                                    <UserMinus className="mr-1 h-4 w-4" />
                                                                    Remove
                                                                </Button>
                                                            </div>
                                                        }
                                                    />
                                                ))}
                                        </ScrollArea>
                                    </GlassCard>
                                </TabsContent>

                                {/* Staff */}
                                <TabsContent value="staff" className="mt-3">
                                    <GlassCard className="p-0">
                                        <ScrollArea className="max-h-[56vh] pr-2">
                                            {loading && (
                                                <div className="space-y-2 p-3">
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                </div>
                                            )}
                                            {!loading && (!payload?.staff || payload.staff.length === 0) && (
                                                <div className="flex items-center gap-2 p-5 text-sm text-neutral-500">
                                                    <CircleAlert className="h-4 w-4" />
                                                    No staff yet.
                                                </div>
                                            )}
                                            {!loading &&
                                                payload?.staff?.map((m) => (
                                                    <MiniUserRow
                                                        key={m.id}
                                                        user={m.user}
                                                        right={
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary" className="glass-badge">
                                                                    Staff
                                                                </Badge>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => openRemove(m, false)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    <UserMinus className="mr-1 h-4 w-4" />
                                                                    Remove
                                                                </Button>
                                                            </div>
                                                        }
                                                    />
                                                ))}
                                        </ScrollArea>
                                    </GlassCard>
                                </TabsContent>

                                {/* Pending */}
                                <TabsContent value="pending" className="mt-3">
                                    <GlassCard className="p-0">
                                        <ScrollArea className="max-h-[56vh] pr-2">
                                            {loading && (
                                                <div className="space-y-2 p-3">
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                </div>
                                            )}
                                            {!loading &&
                                                (!payload?.pending_staff || payload.pending_staff.length === 0) && (
                                                    <div className="flex items-center gap-2 p-5 text-sm text-neutral-500">
                                                        <CircleAlert className="h-4 w-4" />
                                                        No pending invites.
                                                    </div>
                                                )}
                                            {!loading &&
                                                payload?.pending_staff?.map((p) => (
                                                    <MiniUserRow
                                                        key={p.id}
                                                        user={{ username: p.username, email: p.email }}
                                                        right={
                                                            <Badge variant={p.is_admin ? "default" : "secondary"}>
                                                                {p.is_admin ? "Admin" : "Staff"}
                                                            </Badge>
                                                        }
                                                    />
                                                ))}
                                        </ScrollArea>
                                    </GlassCard>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>

                {/* Add staff sheet */}
                {payload && (
                    <StoreAddStaffSheet
                        store={payload}
                        open={addOpen}
                        onOpenChange={setAddOpen}
                        onDone={async () => {
                            setAddOpen(false);
                            await fetchDetails(false);
                        }}
                    />
                )}

                {/* Remove staff dialog */}
                <StaffRemoveDialog
                    open={removeOpen}
                    onOpenChange={setRemoveOpen}
                    onConfirm={confirmRemove}
                    member={removeTarget}
                    submitting={removeSubmitting}
                    allowLastAdmin={allowLastAdmin}
                    onToggleAllowLastAdmin={(v) => setAllowLastAdmin(!!v)}
                />
            </SheetContent>
        </Sheet>
    );
};

export default StoreDetailSheet;
