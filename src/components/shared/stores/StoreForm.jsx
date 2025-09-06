import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Shield, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const STAFF_PERMS = ["read", "write", "edit", "delete"];

export default function StoreForm({
    mode = "create",                // "create" | "update"
    initial = null,                 // initial store data (update mode)
    onSubmit,                       // (payload: FormData|object) => Promise<void>
    submitting = false,
}) {
    const [form, setForm] = useState(() => ({
        name: initial?.name || "",
        email: initial?.contact?.email || initial?.email || "",
        phone_number: initial?.contact?.phone_number || initial?.phone_number || "",
        address: initial?.contact?.address || initial?.address || "",
        province: initial?.location?.province || initial?.province || "",
        district: initial?.location?.district || initial?.district || "",
        sector: initial?.location?.sector || initial?.sector || "",
        cell: initial?.location?.cell || initial?.cell || "",
        village: initial?.location?.village || initial?.village || "",
        map_url: initial?.location?.map_url || initial?.map_url || "",
        image: null,
        remove_image: false,
    }));

    const [withStaff, setWithStaff] = useState(false);
    const [staff, setStaff] = useState([
        { email: "", username: "", phone_number: "", is_admin: false, permissions: ["read"], is_active: true },
    ]);

    const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

    const canSubmit = useMemo(() => {
        return !!form.name && !submitting;
    }, [form.name, submitting]);

    const handleStaffChange = (idx, k, v) => {
        setStaff((rows) => {
            const copy = [...rows];
            if (k === "is_admin" && v) {
                copy[idx] = { ...copy[idx], is_admin: true, permissions: [...STAFF_PERMS] };
            } else if (k === "is_admin" && !v) {
                copy[idx] = { ...copy[idx], is_admin: false, permissions: copy[idx].permissions?.length ? copy[idx].permissions : ["read"] };
            } else if (k === "permissions") {
                copy[idx] = { ...copy[idx], permissions: v };
            } else {
                copy[idx] = { ...copy[idx], [k]: v };
            }
            return copy;
        });
    };

    const submit = async (e) => {
        e.preventDefault();

        if (mode === "create") {
            const payload = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (k === "image") {
                    if (v) payload.append("image", v);
                } else {
                    if (v !== "" && v !== null && v !== undefined) payload.append(k, v);
                }
            });
            if (withStaff) {
                payload.append("staff", JSON.stringify(staff.filter((s) => s.email)));
            }
            await onSubmit(payload);
            return;
        }

        // update -> PATCH (accepts JSON or multipart). We support both.
        const isMultipart = !!form.image || form.remove_image;
        if (isMultipart) {
            const payload = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (k === "image") {
                    if (v) payload.append("image", v);
                } else if (k === "remove_image") {
                    payload.append("remove_image", v ? "true" : "false");
                } else if (v !== "" && v !== null && v !== undefined) {
                    payload.append(k, v);
                }
            });
            await onSubmit(payload, true);
        } else {
            const json = { ...form };
            delete json.image;
            await onSubmit(json, false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Kimironko Supermarket" />
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="info@store.rw" />
                </div>
                <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone_number} onChange={(e) => setField("phone_number", e.target.value)} placeholder="+25078…" />
                </div>
                <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="KG 11 Ave, Kigali" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                    <Label htmlFor="province">Province</Label>
                    <Input id="province" value={form.province} onChange={(e) => setField("province", e.target.value)} placeholder="Kigali City" />
                </div>
                <div>
                    <Label htmlFor="district">District</Label>
                    <Input id="district" value={form.district} onChange={(e) => setField("district", e.target.value)} placeholder="Gasabo" />
                </div>
                <div>
                    <Label htmlFor="sector">Sector</Label>
                    <Input id="sector" value={form.sector} onChange={(e) => setField("sector", e.target.value)} placeholder="Kimironko" />
                </div>
                <div>
                    <Label htmlFor="cell">Cell</Label>
                    <Input id="cell" value={form.cell} onChange={(e) => setField("cell", e.target.value)} placeholder="..." />
                </div>
                <div>
                    <Label htmlFor="village">Village</Label>
                    <Input id="village" value={form.village} onChange={(e) => setField("village", e.target.value)} placeholder="..." />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="map">Map URL</Label>
                    <Input id="map" value={form.map_url} onChange={(e) => setField("map_url", e.target.value)} placeholder="https://maps.google.com/?q=…" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <Label htmlFor="image">Image (square)</Label>
                    <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setField("image", e.target.files?.[0] || null)}
                    />
                    {mode === "update" && (
                        <div className="mt-2 flex items-center gap-2">
                            <Checkbox id="remove_image" checked={form.remove_image} onCheckedChange={(v) => setField("remove_image", !!v)} />
                            <Label htmlFor="remove_image" className="text-sm text-red-600">Remove current image</Label>
                        </div>
                    )}
                </div>
            </div>

            {mode === "create" && (
                <>
                    <Separator className="my-1" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Checkbox id="with_staff" checked={withStaff} onCheckedChange={(v) => setWithStaff(!!v)} />
                            <Label htmlFor="with_staff" className="cursor-pointer">Add staff now (optional)</Label>
                        </div>
                        {withStaff && (
                            <Badge variant="secondary" className="flex gap-1 items-center">
                                <Shield className="h-3.5 w-3.5" /> Admins get all permissions
                            </Badge>
                        )}
                    </div>

                    <AnimatePresence initial={false}>
                        {withStaff && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-3 overflow-hidden"
                            >
                                {staff.map((row, i) => (
                                    <div key={i} className="rounded-xl border p-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                            <div className="lg:col-span-2">
                                                <Label>Email *</Label>
                                                <Input value={row.email} onChange={(e) => handleStaffChange(i, "email", e.target.value)} placeholder="staff@store.rw" />
                                            </div>
                                            <div>
                                                <Label>Username</Label>
                                                <Input value={row.username} onChange={(e) => handleStaffChange(i, "username", e.target.value)} placeholder="john.doe" />
                                            </div>
                                            <div>
                                                <Label>Phone</Label>
                                                <Input value={row.phone_number} onChange={(e) => handleStaffChange(i, "phone_number", e.target.value)} placeholder="0788…" />
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`is_admin_${i}`}
                                                    checked={row.is_admin}
                                                    onCheckedChange={(v) => handleStaffChange(i, "is_admin", !!v)}
                                                />
                                                <Label htmlFor={`is_admin_${i}`}>Admin</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`is_active_${i}`}
                                                    checked={row.is_active}
                                                    onCheckedChange={(v) => handleStaffChange(i, "is_active", !!v)}
                                                />
                                                <Label htmlFor={`is_active_${i}`}>Active</Label>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Settings2 className="h-4 w-4" />
                                                <span className="text-sm font-medium">Permissions</span>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {STAFF_PERMS.map((p) => {
                                                    const checked = row.permissions?.includes(p);
                                                    return (
                                                        <label key={p} className={cn("inline-flex items-center gap-2 text-sm cursor-pointer")}>
                                                            <Checkbox
                                                                checked={checked}
                                                                disabled={row.is_admin}
                                                                onCheckedChange={(v) => {
                                                                    if (row.is_admin) return;
                                                                    const next = new Set(row.permissions || []);
                                                                    if (v) next.add(p); else next.delete(p);
                                                                    handleStaffChange(i, "permissions", Array.from(next));
                                                                }}
                                                            />
                                                            {p}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex justify-end">
                                            {staff.length > 1 && (
                                                <Button type="button" variant="destructive" size="sm" onClick={() => setStaff((r) => r.filter((_, idx) => idx !== i))}>
                                                    <Trash2 className="mr-1.5 h-4 w-4" /> Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="secondary" onClick={() => setStaff((r) => [...r, { email: "", username: "", phone_number: "", is_admin: false, permissions: ["read"], is_active: true }])}>
                                    <Plus className="mr-1.5 h-4 w-4" /> Add another staff
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}

            <div className="pt-1 flex items-center justify-end gap-2">
                <Button type="submit" disabled={!canSubmit} className="min-w-[120px]">
                    {submitting ? (mode === "create" ? "Creating…" : "Saving…") : (mode === "create" ? "Create Store" : "Save Changes")}
                </Button>
            </div>
        </form>
    );
}
