import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus } from "lucide-react";

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
    // update-only
    remove_image: z.boolean().optional(),
});

const staffItem = z.object({
    email: z.string().email(),
    username: z.string().optional().or(z.literal("")),
    phone_number: z.string().optional().or(z.literal("")),
    is_admin: z.boolean().default(false),
    permissions: z.array(z.enum(["read", "write", "edit", "delete"])).optional().default([]),
    is_active: z.boolean().optional().default(true),
});

const createSchema = baseSchema.extend({
    staff: z.array(staffItem).optional().default([]),
});

const StoreForm = ({
    defaultValues,
    onSubmit,
    submitting = false,
    mode = "create", // "create" | "update"
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

    const { control, handleSubmit, register, watch, setValue } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "staff" });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
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

                    <div className="grid gap-1.5">
                        <Label htmlFor="map_url">Google maps URL</Label>
                        <Input id="map_url" placeholder="https://maps.google.com/…" {...register("map_url")} />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="grid gap-1.5">
                        <Label htmlFor="province">Province</Label>
                        <Input id="province" placeholder="Kigali" {...register("province")} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="district">District</Label>
                        <Input id="district" placeholder="Nyarugenge" {...register("district")} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="sector">Sector</Label>
                        <Input id="sector" placeholder="Nyamirambo" {...register("sector")} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="cell">Cell</Label>
                        <Input id="cell" placeholder="Muganza" {...register("cell")} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="village">Village</Label>
                        <Input id="village" placeholder="Agasasa" {...register("village")} />
                    </div>
                </div>
            </div>

            <Separator />

            {/* Image controls */}
            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2">
                <div className="grid gap-1.5">
                    <Label htmlFor="image">Image</Label>
                    <Input id="image" type="file" accept="image/*" {...register("image")} />
                    {!isCreate && (
                        <div className="flex items-center gap-2 pt-1">
                            <Switch id="remove_image" {...register("remove_image")} />
                            <Label htmlFor="remove_image" className="text-xs text-neutral-600">
                                Remove current image
                            </Label>
                        </div>
                    )}
                </div>
            </div>

            {/* Staff (create-only) */}
            {isCreate && (
                <>
                    <Separator />
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-base">Invite staff (optional)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {fields.length === 0 && (
                                <div className="text-sm text-neutral-500">No invites added. You can add them later.</div>
                            )}

                            {fields.map((f, idx) => (
                                <div key={f.id} className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-12">
                                    <div className="md:col-span-3">
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
                                    <div className="md:col-span-2 flex flex-col justify-end">
                                        <div className="flex items-center gap-2">
                                            <Switch {...register(`staff.${idx}.is_admin`)} />
                                            <span className="text-sm">Admin</span>
                                        </div>
                                        <p className="text-xs text-neutral-500">Admins get all permissions.</p>
                                    </div>
                                    <div className="md:col-span-1 flex items-end justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-600"
                                            onClick={() => remove(idx)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="md:col-span-12 text-xs text-neutral-500">
                                        If not admin, you can set permissions later.
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    append({ email: "", username: "", phone_number: "", is_admin: false, permissions: ["read"], is_active: true })
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add invite
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving…" : "Save"}
                </Button>
            </div>
        </form>
    );
};

export default StoreForm;
