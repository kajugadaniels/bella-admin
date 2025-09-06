import React, { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { superadmin } from "@/api";
import { ShieldCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------- constants ------------------------------ */
const PERMS = ["read", "write", "edit", "delete"];
const PermEnum = z.enum(PERMS);

/* ------------------------------- schemas -------------------------------- */
const existingUserSchema = z.object({
    user_id: z.string().min(8, "User ID is required"),
    is_admin: z.boolean().default(false),
    is_active: z.boolean().default(true),
    permissions: z.array(PermEnum).optional().default([]),
});

const newUserSchema = z
    .object({
        email: z.string().email("Enter a valid email"),
        username: z.string().min(2, "Username is required"),
        phone_number: z.string().min(7, "Enter a valid phone").optional().or(z.literal("")),
        password: z.string().min(8, "At least 8 characters"),
        confirm_password: z.string().min(8, "Confirm the password"),
        is_admin: z.boolean().default(true),
        is_active: z.boolean().default(true),
        permissions: z.array(PermEnum).optional().default([]),
    })
    .refine((d) => d.password === d.confirm_password, {
        path: ["confirm_password"],
        message: "Passwords do not match",
    });

/* ------------------------------ UI helpers ------------------------------ */
const PermissionPicker = ({ value = [], onChange, disabled }) => (
    <div className={cn("grid grid-cols-2 gap-2", disabled && "opacity-60 pointer-events-none")}>
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

/* -------------------------------- component ----------------------------- */
const StoreStaffAddSheet = ({ store, open, onOpenChange, onDone }) => {
    const [mode, setMode] = useState("existing"); // 'existing' | 'new'
    const isExisting = mode === "existing";

    const form = useForm({
        resolver: zodResolver(isExisting ? existingUserSchema : newUserSchema),
        mode: "onChange",
        defaultValues: isExisting
            ? { user_id: "", is_admin: false, is_active: true, permissions: ["read"] }
            : {
                email: "",
                username: "",
                phone_number: "",
                password: "",
                confirm_password: "",
                is_admin: true,
                is_active: true,
                permissions: ["read"],
            },
        values: undefined,
    });

    // when switching tabs, reset & swap schema
    const onTabChange = (val) => {
        setMode(val);
        form.reset(
            val === "existing"
                ? { user_id: "", is_admin: false, is_active: true, permissions: ["read"] }
                : {
                    email: "",
                    username: "",
                    phone_number: "",
                    password: "",
                    confirm_password: "",
                    is_admin: true,
                    is_active: true,
                    permissions: ["read"],
                }
        );
    };

    const submitting = form.formState.isSubmitting;
    const isAdmin = form.watch("is_admin");

    const submit = async (data) => {
        try {
            const payload =
                isExisting
                    ? {
                        user_id: data.user_id,
                        is_admin: !!data.is_admin,
                        ...(data.is_admin ? {} : { permissions: data.permissions || [] }),
                        is_active: data.is_active,
                    }
                    : {
                        email: data.email,
                        username: data.username,
                        phone_number: data.phone_number || undefined,
                        password: data.password,
                        confirm_password: data.confirm_password,
                        is_admin: !!data.is_admin,
                        ...(data.is_admin ? {} : { permissions: data.permissions || [] }),
                        is_active: data.is_active,
                    };

            await superadmin.saStoreStaffAdd(store?.id, payload);
            toast.success("Staff member added to store");
            onDone?.();
            onOpenChange?.(false);
        } catch (err) {
            toast.error(err?.message || "Failed to add staff");
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[min(560px,100vw)] border-l border-black/5 bg-white/90 p-0 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/85"
            >
                <div className="h-1.5 w-full bg-gradient-to-r from-[var(--primary-color)] to-emerald-600" />
                <div className="p-5 sm:p-6">
                    <SheetHeader className="mb-3">
                        <SheetTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-emerald-600" />
                            Add staff to <span className="font-semibold">{store?.name || "Store"}</span>
                        </SheetTitle>
                        <SheetDescription>Invite an existing user by ID or create a new account.</SheetDescription>
                    </SheetHeader>

                    <Tabs value={mode} onValueChange={onTabChange} className="w-full">
                        <TabsList className="glass-card grid w-full grid-cols-2 p-1">
                            <TabsTrigger value="existing">Existing user</TabsTrigger>
                            <TabsTrigger value="new">New user</TabsTrigger>
                        </TabsList>

                        {/* Existing user */}
                        <TabsContent value="existing" className="mt-4">
                            <form onSubmit={form.handleSubmit(submit)} className="grid gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="user_id">User ID</Label>
                                    <Input id="user_id" placeholder="Paste user id" {...form.register("user_id")} />
                                    <p className="text-xs text-neutral-500">Find the user’s ID from the Users page.</p>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/60">
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                    <div className="flex items-center gap-2">
                                        <Controller
                                            name="is_admin"
                                            control={form.control}
                                            render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />}
                                        />
                                        <span className="text-sm">Grant admin role</span>
                                    </div>
                                    <div className="ml-auto text-xs text-neutral-500">Admins can manage everything.</div>
                                </div>

                                {!isAdmin && (
                                    <div className="grid gap-2">
                                        <Label>Permissions</Label>
                                        <Controller
                                            name="permissions"
                                            control={form.control}
                                            render={({ field }) => (
                                                <PermissionPicker value={field.value || []} onChange={field.onChange} />
                                            )}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Controller
                                        name="is_active"
                                        control={form.control}
                                        render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />}
                                    />
                                    <span className="text-sm">Active immediately</span>
                                </div>

                                <div className="sticky bottom-0 mt-1 flex justify-end gap-2 rounded-xl border border-black/5 bg-white/85 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/70">
                                    <Button type="button" variant="secondary" onClick={() => onOpenChange?.(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitting} className="text-white">
                                        {submitting ? "Adding…" : "Add staff"}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        {/* New user */}
                        <TabsContent value="new" className="mt-4">
                            <form onSubmit={form.handleSubmit(submit)} className="grid gap-4">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label>Email</Label>
                                        <Input type="email" placeholder="user@example.com" {...form.register("email")} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Username</Label>
                                        <Input placeholder="username" {...form.register("username")} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Phone (optional)</Label>
                                        <Input placeholder="07…" {...form.register("phone_number")} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Password</Label>
                                        <Input type="password" placeholder="••••••••" {...form.register("password")} />
                                    </div>
                                    <div className="grid gap-1.5 sm:col-span-2">
                                        <Label>Confirm password</Label>
                                        <Input type="password" placeholder="••••••••" {...form.register("confirm_password")} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/60">
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                    <div className="flex items-center gap-2">
                                        <Controller
                                            name="is_admin"
                                            control={form.control}
                                            render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />}
                                        />
                                        <span className="text-sm">Grant admin role</span>
                                    </div>
                                    <Badge variant="secondary" className="ml-auto">New account</Badge>
                                </div>

                                {!isAdmin && (
                                    <div className="grid gap-2">
                                        <Label>Permissions</Label>
                                        <Controller
                                            name="permissions"
                                            control={form.control}
                                            render={({ field }) => (
                                                <PermissionPicker value={field.value || []} onChange={field.onChange} />
                                            )}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Controller
                                        name="is_active"
                                        control={form.control}
                                        render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />}
                                    />
                                    <span className="text-sm">Active immediately</span>
                                </div>

                                <div className="sticky bottom-0 mt-1 flex justify-end gap-2 rounded-xl border border-black/5 bg-white/85 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/70">
                                    <Button type="button" variant="secondary" onClick={() => onOpenChange?.(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitting} className="text-white">
                                        {submitting ? "Creating…" : "Create & add"}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default StoreStaffAddSheet;
