import React, { useEffect, useState, useMemo } from "react";
import {
    Activity,
    ClipboardCopy,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Users,
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

function initials(name = "") {
    const n = (name || "").trim();
    if (!n) return "S";
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "S";
    const b = (parts[1]?.[0] || n[1] || "").toUpperCase();
    return (a + b).toUpperCase();
}

const StatChip = ({ icon: Icon, label, value, hint }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white/65 p-3 backdrop-blur-lg dark:border-white/10 dark:bg-neutral-900/50">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--primary-color)]/90 to-emerald-600/90 text-white ring-1 ring-black/5 dark:ring-white/10">
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

const MiniUserRow = ({ user }) => {
    if (!user) return null;
    const text = user.username || user.email || "User";
    const inits = initials(text);
    return (
        <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5">
            <div className="h-7 w-7 shrink-0 rounded-full grid place-items-center text-[12px] font-semibold text-white bg-gradient-to-br from-[var(--primary-color)] to-emerald-600">
                {inits}
            </div>
            <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user.username || "—"}</div>
                <div className="truncate text-xs text-neutral-500">{user.email || "—"}</div>
            </div>
            <div className="ml-auto text-xs text-neutral-500">{user.role || ""}</div>
        </div>
    );
};

const InfoRow = ({ label, value }) => (
    <div className="flex items-start gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5">
        <div className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">
            {label}
        </div>
        <div className="min-w-0 flex-1 truncate text-sm text-neutral-800 dark:text-neutral-200">
            {value || "—"}
        </div>
    </div>
);

const HeaderSkeleton = () => (
    <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
    </div>
);

const StoreDetailSheet = ({ id, open, onOpenChange }) => {
    const [loading, setLoading] = useState(false);
    const [payload, setPayload] = useState(null);

    useEffect(() => {
        let ignore = false;
        async function run() {
            if (!open || !id) return;
            setLoading(true);
            try {
                const { data, message } = await superadmin.getStore(id);
                if (!ignore) {
                    setPayload(data?.data || null);
                    if (message) toast.success(message);
                }
            } catch (err) {
                if (!ignore) {
                    toast.error(err?.message || "Failed to fetch store details.");
                    setPayload(null);
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        run();
        return () => {
            ignore = true;
        };
    }, [id, open]);

    const stats = payload?.stats || {};
    const location = payload?.location || {};
    const contact = payload?.contact || {};

    const counts = {
        admins: Array.isArray(payload?.admins) ? payload.admins.length : 0,
        staff: Array.isArray(payload?.staff) ? payload.staff.length : 0,
        pending: Array.isArray(payload?.pending_staff) ? payload.pending_staff.length : 0,
    };

    const avatar = useMemo(() => {
        if (!payload) return null;
        if (payload.image) {
            return (
                <img
                    src={payload.image}
                    alt={payload.name}
                    className="h-12 w-12 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
                />
            );
        }
        return (
            <div className="h-12 w-12 rounded-xl grid place-items-center text-sm font-semibold text-white bg-gradient-to-br from-[var(--primary-color)] to-emerald-600">
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {/* Wider, roomier, glassy panel */}
            <SheetContent
                side="right"
                className="w-[min(900px,100vw)] sm:w-[min(960px,100vw)] glass-card p-0"
            >
                {/* Decorative top bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[var(--primary-color)] to-emerald-600" />

                <div className="p-5 sm:p-6">
                    <SheetHeader className="mb-3">
                        <SheetTitle className="sr-only">Store details</SheetTitle>
                        {loading ? (
                            <HeaderSkeleton />
                        ) : (
                            <div className="flex flex-wrap items-center gap-3">
                                {avatar}
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-lg font-semibold">{payload?.name || "Store details"}</div>
                                    <SheetDescription className="truncate">
                                        {payload?.id || ""}
                                    </SheetDescription>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="glass-button" onClick={copyId}>
                                        <ClipboardCopy className="mr-2 h-4 w-4" />
                                        Copy ID
                                    </Button>
                                    {contact.email && (
                                        <a href={`mailto:${contact.email}`} className="contents">
                                            <Button variant="outline" size="sm" className="glass-button">
                                                <Mail className="mr-2 h-4 w-4" />
                                                Email
                                            </Button>
                                        </a>
                                    )}
                                    {contact.phone_number && (
                                        <a href={`tel:${contact.phone_number}`} className="contents">
                                            <Button variant="outline" size="sm" className="glass-button">
                                                <Phone className="mr-2 h-4 w-4" />
                                                Call
                                            </Button>
                                        </a>
                                    )}
                                    {location?.map_url && (
                                        <a href={location.map_url} target="_blank" rel="noreferrer" className="contents">
                                            <Button size="sm" className="glass-button">
                                                <MapPin className="mr-2 h-4 w-4" />
                                                Open map
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </SheetHeader>

                    <Separator className="soft-divider" />

                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {/* LEFT COLUMN: Info cards */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="rounded-2xl border border-black/5 bg-white/65 p-3 backdrop-blur-lg dark:border-white/10 dark:bg-neutral-900/50">
                                <div className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Contact</div>
                                <div className="mt-2 space-y-1">
                                    <InfoRow label="Email" value={contact.email} />
                                    <InfoRow label="Phone" value={contact.phone_number} />
                                    <InfoRow label="Address" value={contact.address} />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-black/5 bg-white/65 p-3 backdrop-blur-lg dark:border-white/10 dark:bg-neutral-900/50">
                                <div className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Location</div>
                                <div className="mt-2 space-y-1">
                                    <InfoRow label="Province" value={location.province} />
                                    <InfoRow label="District" value={location.district} />
                                    <InfoRow label="Sector" value={location.sector} />
                                    <InfoRow
                                        label="Cell/Village"
                                        value={[location.cell, location.village].filter(Boolean).join(" / ")}
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <StatChip icon={Users} label="Staff" value={stats.staff_count} hint="Total team" />
                                <StatChip icon={ShieldCheck} label="Admins" value={stats.admin_count} hint="Managers" />
                                <StatChip icon={Activity} label="Active" value={stats.active_staff} hint="This period" />
                                <StatChip icon={Activity} label="Pending" value={stats.pending_invites} hint="Invites" />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Tabs & lists */}
                        <div className="lg:col-span-2">
                            <Tabs defaultValue="admins" className="w-full">
                                <TabsList className="glass-card grid w-full grid-cols-3 p-1">
                                    <TabsTrigger value="admins">
                                        Admins
                                        <Badge variant="secondary" className="ml-2">{counts.admins}</Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="staff">
                                        Staff
                                        <Badge variant="secondary" className="ml-2">{counts.staff}</Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="pending">
                                        Pending
                                        <Badge variant="secondary" className="ml-2">{counts.pending}</Badge>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="admins" className="mt-3">
                                    <div className="rounded-2xl border border-black/5 bg-white/65 p-2 backdrop-blur-lg dark:border-white/10 dark:bg-neutral-900/50">
                                        <ScrollArea className="max-h-[56vh] pr-2">
                                            {loading && (
                                                <div className="space-y-2 p-3">
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                </div>
                                            )}
                                            {!loading && (!payload?.admins || payload.admins.length === 0) && (
                                                <div className="p-4 text-sm text-neutral-500">No admins yet.</div>
                                            )}
                                            {!loading &&
                                                payload?.admins?.map((s) => <MiniUserRow key={s.id} user={s.user} />)}
                                        </ScrollArea>
                                    </div>
                                </TabsContent>

                                <TabsContent value="staff" className="mt-3">
                                    <div className="rounded-2xl border border-black/5 bg-white/65 p-2 backdrop-blur-lg dark:border-white/10 dark:bg-neutral-900/50">
                                        <ScrollArea className="max-h-[56vh] pr-2">
                                            {loading && (
                                                <div className="space-y-2 p-3">
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                </div>
                                            )}
                                            {!loading && (!payload?.staff || payload.staff.length === 0) && (
                                                <div className="p-4 text-sm text-neutral-500">No staff yet.</div>
                                            )}
                                            {!loading &&
                                                payload?.staff?.map((s) => <MiniUserRow key={s.id} user={s.user} />)}
                                        </ScrollArea>
                                    </div>
                                </TabsContent>

                                <TabsContent value="pending" className="mt-3">
                                    <div className="rounded-2xl border border-black/5 bg-white/65 p-2 backdrop-blur-lg dark:border-white/10 dark:bg-neutral-900/50">
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
                                                    <div className="p-4 text-sm text-neutral-500">No pending invites.</div>
                                                )}
                                            {!loading &&
                                                payload?.pending_staff?.map((p) => (
                                                    <div
                                                        key={p.id}
                                                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
                                                    >
                                                        <div className="h-7 w-7 shrink-0 rounded-full grid place-items-center text-[12px] font-semibold text-white bg-gradient-to-br from-[var(--primary-color)] to-emerald-600">
                                                            {initials(p.username || p.email)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium">{p.username || "—"}</div>
                                                            <div className="truncate text-xs text-neutral-500">{p.email || "—"}</div>
                                                        </div>
                                                        <div className="ml-auto">
                                                            <Badge variant={p.is_admin ? "default" : "secondary"} className="glass-badge">
                                                                {p.is_admin ? "Admin" : "Staff"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                        </ScrollArea>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default StoreDetailSheet;
