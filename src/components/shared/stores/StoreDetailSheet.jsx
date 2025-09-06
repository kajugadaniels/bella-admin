import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Copy, Mail, Phone, MapPin, ExternalLink, User2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton"; // if you don't have Skeleton, replace with simple <div className="animate-pulse ..."/>

function initials(name = "") {
    const n = (name || "").trim();
    if (!n) return "S";
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "S";
    const b = (parts[1]?.[0] || n[1] || "").toUpperCase();
    return (a + b).toUpperCase();
}

const StatCard = ({ label, value }) => (
    <div className="rounded-2xl bg-white/70 dark:bg-neutral-900/60 border border-black/5 dark:border-white/10 p-4 backdrop-blur-md">
        <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value ?? 0}</div>
    </div>
);

const FieldRow = ({ icon: Icon, label, value, href, copyable }) => {
    const onCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(String(value || ""));
            toast.success(`${label} copied`);
        } catch {
            toast.error(`Failed to copy ${label}`);
        }
    }, [label, value]);

    const Content = (
        <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors">
            <div className="h-8 w-8 grid place-items-center rounded-lg bg-gradient-to-br from-[var(--primary-color)] to-emerald-600 text-white">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
                <div className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {value || "—"}
                </div>
            </div>
            <div className="ml-auto flex items-center gap-1">
                {copyable && value ? (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCopy}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy {label}</span>
                    </Button>
                ) : null}
            </div>
        </div>
    );

    if (href && value) {
        return (
            <a href={href} target="_blank" rel="noreferrer">
                {Content}
            </a>
        );
    }
    return Content;
};

const MiniUserRow = ({ user }) => {
    if (!user) return null;
    const text = user.username || user.email || "User";
    const inits = initials(text);
    return (
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors">
            <div className="h-7 w-7 shrink-0 rounded-full grid place-items-center text-[12px] font-semibold text-white
        bg-gradient-to-br from-[var(--primary-color)] to-emerald-600">
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
        return () => { ignore = true; };
    }, [id, open]);

    const stats = payload?.stats || {};
    const location = payload?.location || {};
    const contact = payload?.contact || {};

    const avatar = useMemo(() => {
        if (!payload) return null;
        if (payload.image) {
            return (
                <img
                    src={payload.image}
                    alt={payload.name}
                    className="h-14 w-14 rounded-2xl object-cover ring-1 ring-black/5 dark:ring-white/10"
                />
            );
        }
        return (
            <div className="h-14 w-14 rounded-2xl grid place-items-center text-base font-semibold text-white bg-gradient-to-br from-[var(--primary-color)] to-emerald-600">
                {initials(payload.name)}
            </div>
        );
    }, [payload]);

    const titleBlock = (
        <div className="flex items-start gap-4">
            {avatar || <div className="h-14 w-14 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />}
            <div className="min-w-0">
                <div className="truncate text-lg font-semibold">{payload?.name || (loading ? "Loading…" : "Store details")}</div>
                <SheetDescription className="truncate">{payload?.id || ""}</SheetDescription>
            </div>
            {location?.map_url && (
                <a href={location.map_url} target="_blank" rel="noreferrer" className="ml-auto">
                    <Button size="sm" variant="outline" className="glass-button">
                        <MapPin className="mr-2 h-4 w-4" />
                        Open map
                    </Button>
                </a>
            )}
        </div>
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {/* Increased width */}
            <SheetContent side="right" className="w-[min(900px,100vw)] md:w-[860px] lg:w-[900px] p-0 glass-card">
                {/* Hero / header */}
                <div className="relative">
                    <div className="h-20 w-full bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 opacity-90" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 40 40%22><path fill=%22white%22 fill-opacity=%220.06%22 d=%22M0 22.5c5.333 0 5.333-5 10.666-5s5.333 5 10.667 5 5.333-5 10.667-5S37.333 22.5 40 22.5V40H0V22.5z%22/></svg>')] opacity-40 pointer-events-none" />
                    <div className="px-5 pb-3 pt-4">
                        <SheetHeader>
                            <SheetTitle asChild>{titleBlock}</SheetTitle>
                        </SheetHeader>
                    </div>
                </div>

                <Separator className="soft-divider" />

                <div className="px-5 py-4">
                    {/* Top info grid */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {/* Contact & Location */}
                        <div className="lg:col-span-2 grid gap-4">
                            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-3 backdrop-blur-md">
                                <div className="mb-2 flex items-center gap-2">
                                    <User2 className="h-4 w-4 text-neutral-500" />
                                    <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Profile</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <FieldRow
                                        icon={Mail}
                                        label="Email"
                                        value={contact.email}
                                        href={contact.email ? `mailto:${contact.email}` : undefined}
                                        copyable
                                    />
                                    <FieldRow
                                        icon={Phone}
                                        label="Phone"
                                        value={contact.phone_number}
                                        href={contact.phone_number ? `tel:${contact.phone_number}` : undefined}
                                        copyable
                                    />
                                    <FieldRow
                                        icon={MapPin}
                                        label="Address"
                                        value={contact.address}
                                        href={location?.map_url}
                                    />
                                    <div className="rounded-xl px-3 py-2">
                                        <div className="text-xs uppercase tracking-wide text-neutral-500">Region</div>
                                        <div className="mt-1 text-sm text-neutral-800 dark:text-neutral-200">
                                            {[location?.province, location?.district, location?.sector]
                                                .filter(Boolean)
                                                .join(" • ") || "—"}
                                        </div>
                                        {(location?.cell || location?.village) && (
                                            <div className="text-xs text-neutral-500">
                                                {[location?.cell, location?.village].filter(Boolean).join(" / ")}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick actions / map */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-3 backdrop-blur-md">
                                    <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Map</div>
                                    <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-neutral-50/70 dark:bg-white/5 p-3">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm">
                                                {location?.map_url ? "Google Maps link" : "No map link provided"}
                                            </div>
                                            <div className="truncate text-xs text-neutral-500">{location?.map_url || "—"}</div>
                                        </div>
                                        {location?.map_url && (
                                            <a href={location.map_url} target="_blank" rel="noreferrer">
                                                <Button variant="secondary" size="sm" className="glass-button">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Open
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-3 backdrop-blur-md">
                                    <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Status</div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <Badge className="glass-badge" variant="secondary">
                                            {payload?.image ? "Custom cover" : "No cover image"}
                                        </Badge>
                                        <Badge className="glass-badge" variant={stats?.staff_count ? "default" : "secondary"}>
                                            {stats?.staff_count ? "Has staff" : "No staff"}
                                        </Badge>
                                        <Badge className="glass-badge" variant={stats?.admin_count ? "default" : "secondary"}>
                                            {stats?.admin_count ? "Has admins" : "No admins"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid gap-3 h-fit">
                            <StatCard label="Staff" value={stats.staff_count} />
                            <StatCard label="Admins" value={stats.admin_count} />
                            <StatCard label="Active" value={stats.active_staff} />
                            <StatCard label="Pending invites" value={stats.pending_invites} />
                        </div>
                    </div>

                    <Separator className="my-5 soft-divider" />

                    {/* Lists */}
                    <Tabs defaultValue="admins" className="w-full">
                        <TabsList className="glass-card grid w-full grid-cols-3 p-1 rounded-2xl">
                            <TabsTrigger value="admins">Admins</TabsTrigger>
                            <TabsTrigger value="staff">Staff</TabsTrigger>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                        </TabsList>

                        <TabsContent value="admins" className="mt-4">
                            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-2 backdrop-blur-md">
                                <ScrollArea className="max-h-[45vh] pr-2">
                                    {loading && (
                                        <div className="space-y-2 p-3">
                                            <Skeleton className="h-9 w-full rounded-lg" />
                                            <Skeleton className="h-9 w-full rounded-lg" />
                                            <Skeleton className="h-9 w-full rounded-lg" />
                                        </div>
                                    )}
                                    {!loading && (!payload?.admins || payload.admins.length === 0) && (
                                        <div className="p-4 text-sm text-neutral-500">No admins yet.</div>
                                    )}
                                    {!loading && payload?.admins?.map((s) => (
                                        <MiniUserRow key={s.id} user={s.user} />
                                    ))}
                                </ScrollArea>
                            </div>
                        </TabsContent>

                        <TabsContent value="staff" className="mt-4">
                            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-2 backdrop-blur-md">
                                <ScrollArea className="max-h-[45vh] pr-2">
                                    {loading && (
                                        <div className="space-y-2 p-3">
                                            <Skeleton className="h-9 w-full rounded-lg" />
                                            <Skeleton className="h-9 w-full rounded-lg" />
                                            <Skeleton className="h-9 w-full rounded-lg" />
                                        </div>
                                    )}
                                    {!loading && (!payload?.staff || payload.staff.length === 0) && (
                                        <div className="p-4 text-sm text-neutral-500">No staff yet.</div>
                                    )}
                                    {!loading && payload?.staff?.map((s) => (
                                        <MiniUserRow key={s.id} user={s.user} />
                                    ))}
                                </ScrollArea>
                            </div>
                        </TabsContent>

                        <TabsContent value="pending" className="mt-4">
                            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-2 backdrop-blur-md">
                                <ScrollArea className="max-h-[45vh] pr-2">
                                    {loading && (
                                        <div className="space-y-2 p-3">
                                            <Skeleton className="h-9 w-full rounded-lg" />
                                            <Skeleton className="h-9 w-full rounded-lg" />
                                            <Skeleton className="h-9 w-full rounded-lg" />
                                        </div>
                                    )}
                                    {!loading && (!payload?.pending_staff || payload.pending_staff.length === 0) && (
                                        <div className="p-4 text-sm text-neutral-500">No pending invites.</div>
                                    )}
                                    {!loading && payload?.pending_staff?.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center gap-3 rounded-lg p-2 hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors"
                                        >
                                            <div className="h-7 w-7 shrink-0 rounded-full grid place-items-center text-[12px] font-semibold text-white
                        bg-gradient-to-br from-[var(--primary-color)] to-emerald-600">
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
            </SheetContent>
        </Sheet>
    );
};

export default StoreDetailSheet;
