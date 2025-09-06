import React, { useCallback, useEffect, useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDropzone } from "react-dropzone";
import { Provinces, Districts, Sectors, Cells, Villages } from "rwanda";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, UploadCloud, ShieldCheck } from "lucide-react";

const PERMS = ["read", "write", "edit", "delete"];
const PermEnum = z.enum(PERMS);

const baseSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone_number: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    province: z.string().optional().or(z.literal("")),
    district: z.string().optional().or(z.literal("")),
    sector: z.string().optional().or(z.literal("")),
    cell: z.string().optional().or(z.literal("")),
    village: z.string().optional().or(z.literal("")),
    map_url: z.string().url("Invalid URL").optional().or(z.literal("")),
    image: z.any().optional(),
    remove_image: z.boolean().optional(), // update-only
});

const staffItem = z.object({
    email: z.string().email(),
    username: z.string().optional().or(z.literal("")),
    phone_number: z.string().optional().or(z.literal("")),
    is_admin: z.boolean().default(false),
    permissions: z.array(PermEnum).optional().default([]),
    is_active: z.boolean().optional().default(true),
});

const createSchema = baseSchema.extend({
    staff: z.array(staffItem).optional().default([]),
});

/** ----------------------------
 * Safe wrappers for `rwanda`
 * ---------------------------*/
const toKey = (s) => (typeof s === "string" ? s.trim().toLowerCase() : undefined);

const safeProvinces = () => {
    try {
        const list = Provinces();
        return Array.isArray(list) ? list : [];
    } catch (e) {
        console.error("[rwanda] Provinces()", e);
        return [];
    }
};

const safeDistricts = (province) => {
    const p = toKey(province);
    if (!p) return [];
    try {
        const list = Districts(p);
        return Array.isArray(list) ? list : [];
    } catch (e) {
        console.error("[rwanda] Districts()", { province }, e);
        return [];
    }
};

const safeSectors = (province, district) => {
    const p = toKey(province);
    const d = toKey(district);
    if (!p || !d) return [];
    try {
        const list = Sectors(p, d);
        return Array.isArray(list) ? list : [];
    } catch (e) {
        console.error("[rwanda] Sectors()", { province, district }, e);
        return [];
    }
};

const safeCells = (province, district, sector) => {
    const p = toKey(province);
    const d = toKey(district);
    const s = toKey(sector);
    if (!p || !d || !s) return [];
    try {
        const list = Cells(p, d, s);
        return Array.isArray(list) ? list : [];
    } catch (e) {
        console.error("[rwanda] Cells()", { province, district, sector }, e);
        return [];
    }
};

const safeVillages = (province, district, sector, cell) => {
    const p = toKey(province);
    const d = toKey(district);
    const s = toKey(sector);
    const c = toKey(cell);
    if (!p || !d || !s || !c) return [];
    try {
        const list = Villages(p, d, s, c);
        return Array.isArray(list) ? list : [];
    } catch (e) {
        console.error("[rwanda] Villages()", { province, district, sector, cell }, e);
        return [];
    }
};

/** ----------------------------
 * UI subcomponents
 * ---------------------------*/
const GlassSection = ({ title, children, extra }) => (
    <div className="rounded-2xl border border-black/5 bg-white/60 p-4 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/40">
        <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">{title}</div>
            {extra}
        </div>
        <div className="grid gap-3">{children}</div>
    </div>
);

const PermissionPicker = ({ value = [], onChange, disabled }) => {
    return (
        <div className={`grid grid-cols-2 gap-2 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
            {PERMS.map((p) => {
                const checked = value.includes(p);
                return (
                    <label
                        key={p}
                        className="flex items-center gap-2 rounded-lg border border-black/5 bg-white/80 px-2 py-1 text-sm backdrop-blur dark:border-white/10 dark:bg-neutral-900/50"
                    >
                        <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                                if (disabled) return;
                                const next = new Set(value);
                                v ? next.add(p) : next.delete(p);
                                onChange?.(Array.from(next));
                            }}
                        />
                        <span className="capitalize">{p}</span>
                    </label>
                );
            })}
        </div>
    );
};

const StaffInviteRow = ({ idx, register, control, remove, watch }) => {
    const isAdmin = watch(`staff.${idx}.is_admin`);
    const emailVal = watch(`staff.${idx}.email`) || "";
    const initials = (emailVal || "U").slice(0, 2).toUpperCase();

    return (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-black/5 bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/40 md:grid-cols-12">
            <div className="md:col-span-12 flex items-center gap-2 text-xs text-neutral-500">
                <div className="h-7 w-7 shrink-0 rounded-full grid place-items-center text-[12px] font-semibold text-white bg-gradient-to-br from-[var(--primary-color)] to-emerald-600">
                    {initials}
                </div>
                <span>Invite #{idx + 1}</span>
                {isAdmin && (
                    <Badge className="ml-2 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" /> Admin
                    </Badge>
                )}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-red-600"
                    onClick={() => remove(idx)}
                >
                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                </Button>
            </div>

            <div className="md:col-span-4">
                <Label>Email</Label>
                <Input placeholder="user@example.com" {...register(`staff.${idx}.email`)} />
            </div>
            <div className="md:col-span-3">
                <Label>Username</Label>
                <Input placeholder="username" {...register(`staff.${idx}.username`)} />
            </div>
            <div className="md:col-span-3">
                <Label>Phone</Label>
                <Input placeholder="07…" {...register(`staff.${idx}.phone_number`)} />
            </div>
            <div className="md:col-span-2 flex items-end">
                <div className="flex items-center gap-2">
                    <Controller
                        name={`staff.${idx}.is_admin`}
                        control={control}
                        render={({ field }) => (
                            <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        )}
                    />
                    <span className="text-sm">Admin</span>
                </div>
            </div>

            {!isAdmin && (
                <div className="md:col-span-12">
                    <Label className="text-xs text-neutral-500">Permissions</Label>
                    <Controller
                        name={`staff.${idx}.permissions`}
                        control={control}
                        render={({ field }) => (
                            <PermissionPicker value={field.value || []} onChange={field.onChange} disabled={false} />
                        )}
                    />
                    <p className="mt-1 text-xs text-neutral-500">Choose what this staff member can do.</p>
                </div>
            )}
        </div>
    );
};

const StoreForm = ({
    defaultValues,
    onSubmit,
    submitting = false,
    mode = "create",
}) => {
    const isCreate = mode === "create";

    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            phone_number: "",
            address: "",
            province: "",
            district: "",
            sector: "",
            cell: "",
            village: "",
            map_url: "",
            image: null,
            remove_image: false,
            staff: [],
            ...(defaultValues || {}),
        },
        resolver: zodResolver(isCreate ? createSchema : baseSchema),
        mode: "onChange",
    });

    const { control, handleSubmit, register, watch, setValue, formState } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "staff" });

    // Location watched values
    const pv = watch("province");
    const dt = watch("district");
    const sc = watch("sector");
    const cl = watch("cell");

    // ✅ SAFE: every call wrapped & normalized
    const provinces = useMemo(() => safeProvinces(), []);
    const districts = useMemo(() => safeDistricts(pv), [pv]);
    const sectors = useMemo(() => safeSectors(pv, dt), [pv, dt]);
    const cells = useMemo(() => safeCells(pv, dt, sc), [pv, dt, sc]);
    const villages = useMemo(() => safeVillages(pv, dt, sc, cl), [pv, dt, sc, cl]);

    // Dropzone
    const onDrop = useCallback(
        (acceptedFiles) => {
            setValue("image", acceptedFiles, { shouldDirty: true });
        },
        [setValue]
    );
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        maxFiles: 1,
    });

    const file = Array.isArray(watch("image")) ? watch("image")[0] : null;
    const preview = file ? URL.createObjectURL(file) : null;

    // Clean up the preview URL to avoid memory leaks
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            {/* Store Info */}
            <GlassSection title="Store information">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="name">Store name</Label>
                        <Input id="name" placeholder="e.g., Simba UTC" {...register("name")} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="store@example.com" {...register("email")} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="phone_number">Phone</Label>
                        <Input id="phone_number" placeholder="0788…" {...register("phone_number")} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" placeholder="Street / Avenue" {...register("address")} />
                    </div>

                    <div className="md:col-span-2 grid gap-1.5">
                        <Label htmlFor="map_url">Google maps URL</Label>
                        <Input id="map_url" placeholder="https://maps.google.com/…" {...register("map_url")} />
                    </div>
                </div>
            </GlassSection>

            {/* Location */}
            <GlassSection title="Location">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="grid gap-1.5">
                        <Label>Province</Label>
                        <Controller
                            name="province"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value || ""}
                                    onValueChange={(v) => {
                                        field.onChange(v);
                                        setValue("district", "");
                                        setValue("sector", "");
                                        setValue("cell", "");
                                        setValue("village", "");
                                    }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                                    <SelectContent className="glass-menu">
                                        {provinces.map((p) => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label>District</Label>
                        <Controller
                            name="district"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value || ""}
                                    onValueChange={(v) => {
                                        field.onChange(v);
                                        setValue("sector", "");
                                        setValue("cell", "");
                                        setValue("village", "");
                                    }}
                                    disabled={!pv}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                                    <SelectContent className="glass-menu">
                                        {districts.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Sector</Label>
                        <Controller
                            name="sector"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value || ""}
                                    onValueChange={(v) => {
                                        field.onChange(v);
                                        setValue("cell", "");
                                        setValue("village", "");
                                    }}
                                    disabled={!pv || !dt}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
                                    <SelectContent className="glass-menu">
                                        {sectors.map((s) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Cell</Label>
                        <Controller
                            name="cell"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value || ""}
                                    onValueChange={(v) => {
                                        field.onChange(v);
                                        setValue("village", "");
                                    }}
                                    disabled={!pv || !dt || !sc}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select cell" /></SelectTrigger>
                                    <SelectContent className="glass-menu">
                                        {cells.map((c) => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="md:col-span-2 grid gap-1.5">
                        <Label>Village</Label>
                        <Controller
                            name="village"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value || ""}
                                    onValueChange={field.onChange}
                                    disabled={!pv || !dt || !sc || !cl}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select village" /></SelectTrigger>
                                    <SelectContent className="glass-menu">
                                        {villages.map((v) => (
                                            <SelectItem key={v} value={v}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>
            </GlassSection>

            {/* Image */}
            <GlassSection
                title="Store image"
                extra={preview ? <Badge variant="secondary" className="glass-badge">Preview</Badge> : null}
            >
                <div
                    {...getRootProps()}
                    className={`group relative grid place-items-center rounded-2xl border border-dashed p-6 transition-colors ${isDragActive
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-black/10 bg-white/70 dark:border-white/10 dark:bg-neutral-900/40"
                        }`}
                >
                    <input {...getInputProps()} />
                    {!preview ? (
                        <div className="flex flex-col items-center text-center">
                            <UploadCloud className="mb-2 h-6 w-6 opacity-70" />
                            <div className="text-sm font-medium">Drag & drop an image</div>
                            <div className="text-xs text-neutral-500">or click to browse</div>
                        </div>
                    ) : (
                        <div className="w-full">
                            <img
                                src={preview}
                                alt="Preview"
                                className="mx-auto h-40 w-full max-w-sm rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
                            />
                            <div className="mt-2 text-center text-xs text-neutral-500">
                                {file?.name} — {(file?.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                        </div>
                    )}
                </div>
            </GlassSection>

            {/* Staff (create-only) */}
            {isCreate && (
                <GlassSection
                    title="Invite staff (optional)"
                    extra={
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                append({
                                    email: "",
                                    username: "",
                                    phone_number: "",
                                    is_admin: false,
                                    permissions: ["read"],
                                    is_active: true,
                                })
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add invite
                        </Button>
                    }
                >
                    {fields.length === 0 && (
                        <div className="rounded-xl border border-dashed border-black/10 bg-white/60 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/40">
                            No invites added yet.
                        </div>
                    )}

                    {fields.map((f, idx) => (
                        <StaffInviteRow
                            key={f.id}
                            idx={idx}
                            register={register}
                            control={control}
                            remove={remove}
                            watch={watch}
                        />
                    ))}
                </GlassSection>
            )}

            {/* Sticky bottom actions */}
            <div className="sticky bottom-0 z-10 mt-2 rounded-xl border border-black/5 bg-white/85 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/70">
                <div className="flex items-center justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => history.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={submitting || !formState.isValid}>
                        {submitting ? "Saving…" : "Save store"}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default StoreForm;
