import React, { useEffect, useState, useMemo } from "react";
import { ExternalLink, MapPin } from "lucide-react";
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

function initials(name = "") {
    const n = (name || "").trim();
    if (!n) return "S";
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "S";
    const b = (parts[1]?.[0] || n[1] || "").toUpperCase();
    return (a + b).toUpperCase();
}

const StatChip = ({ label, value }) => (
    <div className="flex flex-col items-start rounded-xl border border-black/5 bg-white/60 p-3 text-sm backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
        <div className="text-neutral-500">{label}</div>
        <div className="mt-1 text-lg font-semibold tabular-nums">{value ?? 0}</div>
    </div>
);

const MiniUserRow = ({ user }) => {
    if (!user) return null;
    const text = user.username || user.email || "User";
    const inits = initials(text);
    return (
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors">
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[min(560px,100vw)] glass-card p-0">
                <div className="p-4 sm:p-5">
                    <SheetHeader className="mb-2">
                        <SheetTitle className="flex items-center gap-3">
                            {avatar}
                            <div className="min-w-0">
                                <div className="truncate text-base font-semibold">{payload?.name || "Store details"}</div>
                                <SheetDescription className="truncate">
                                    {payload?.id || ""}
                                </SheetDescription>
                            </div>
                            {location?.map_url && (
                                <a href={location.map_url} target="_blank" rel="noreferrer" className="ml-auto">
                                    <Button size="sm" variant="outline" className="glass-button">
                                        <MapPin className="mr-2 h-4 w-4" />
                                        Open map
                                    </Button>
                                </a>
                            )}
                        </SheetTitle>
                    </SheetHeader>

                    <Separator className="soft-divider" />

                    <div className="mt-4 grid gap-4">
                        {/* Blocks */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-black/5 bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
                                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Contact</div>
                                <div className="mt-2 space-y-1 text-sm">
                                    <div>Email: <span className="text-neutral-700 dark:text-neutral-300">{contact.email || "—"}</span></div>
                                    <div>Phone: <span className="text-neutral-700 dark:text-neutral-300">{contact.phone_number || "—"}</span></div>
                                    <div>Address: <span className="text-neutral-700 dark:text-neutral-300">{contact.address || "—"}</span></div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-black/5 bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
                                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Location</div>
                                <div className="mt-2 space-y-1 text-sm">
                                    <div>Province: <span className="text-neutral-700 dark:text-neutral-300">{location.province || "—"}</span></div>
                                    <div>District: <span className="text-neutral-700 dark:text-neutral-300">{location.district || "—"}</span></div>
                                    <div>Sector: <span className="text-neutral-700 dark:text-neutral-300">{location.sector || "—"}</span></div>
                                    <div>Cell/Village: <span className="text-neutral-700 dark:text-neutral-300">{[location.cell, location.village].filter(Boolean).join(" / ") || "—"}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <StatChip label="Staff" value={stats.staff_count} />
                            <StatChip label="Admins" value={stats.admin_count} />
                            <StatChip label="Active" value={stats.active_staff} />
                            <StatChip label="Pending" value={stats.pending_invites} />
                        </div>
                    </div>

                    <Separator className="my-4 soft-divider" />

                    {/* Tabs */}
                    <Tabs defaultValue="admins" className="w-full">
                        <TabsList className="glass-card grid w-full grid-cols-3 p-1">
                            <TabsTrigger value="admins">Admins</TabsTrigger>
                            <TabsTrigger value="staff">Staff</TabsTrigger>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                        </TabsList>

                        <TabsContent value="admins" className="mt-3">
                            <div className="rounded-xl border border-black/5 bg-white/60 p-2 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
                                <ScrollArea className="max-h-[40vh] pr-2">
                                    {loading && (
                                        <div className="p-4 text-sm text-neutral-500">Loading…</div>
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

                        <TabsContent value="staff" className="mt-3">
                            <div className="rounded-xl border border-black/5 bg-white/60 p-2 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
                                <ScrollArea className="max-h-[40vh] pr-2">
                                    {loading && (
                                        <div className="p-4 text-sm text-neutral-500">Loading…</div>
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

                        <TabsContent value="pending" className="mt-3">
                            <div className="rounded-xl border border-black/5 bg-white/60 p-2 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
                                <ScrollArea className="max-h-[40vh] pr-2">
                                    {loading && (
                                        <div className="p-4 text-sm text-neutral-500">Loading…</div>
                                    )}
                                    {!loading && (!payload?.pending_staff || payload.pending_staff.length === 0) && (
                                        <div className="p-4 text-sm text-neutral-500">No pending invites.</div>
                                    )}
                                    {!loading && payload?.pending_staff?.map((p) => (
                                        <div key={p.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors">
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
            </SheetContent>
        </Sheet>
    );
};

export default StoreDetailSheet;
