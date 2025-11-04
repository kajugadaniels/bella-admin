import React, { useMemo, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { superadmin } from "@/api";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserPlus, ShieldCheck, Mail } from "lucide-react";

const PERMS = ["read", "write", "edit", "delete"];

const existingUserSchema = z.object({
    user_id: z.string().min(6, "User ID is required"),
    is_admin: z.boolean().default(false),
    permissions: z.array(z.enum(PERMS)).optional().default([]),
    is_active: z.boolean().default(true),
});

// Invite flow: NO password fields now (backend generates & emails a 24h temp password)
const inviteSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3),
    phone_number: z.string().optional().or(z.literal("")),
    is_admin: z.boolean().default(false),
    permissions: z.array(z.enum(PERMS)).optional().default([]),
    is_active: z.boolean().default(true),
});

function PermissionPicker({ value = [], onChange, disabled }) {
    return (
        <div className={cn("grid grid-cols-2 gap-2", disabled && "opacity-60 pointer-events-none")}>
            {PERMS.map((p) => {
                const checked = value.includes(p);
                return (
                    <label
                        key={p}
                        className="flex items-center gap-2 rounded-lg border border-black/5 bg-white/80 px-2 py-1 text-sm backdrop-blur"
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
}

const Section = ({ title, children, extra }) => (
    <div className="rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">{title}</div>
            {extra}
        </div>
        <div className="grid gap-3">{children}</div>
    </div>
);

export default function StoreAddStaffSheet({ store, open, onOpenChange, onDone }) {
    const storeId = typeof store === "string" ? store : store?.id;
    const title = typeof store === "object" ? store?.name : "Add staff";

    const [tab, setTab] = useState("existing");
    const [submitting, setSubmitting] = useState(false);

    const existingForm = useForm({
        resolver: zodResolver(existingUserSchema),
        defaultValues: {
            user_id: "",
            is_admin: false,
            permissions: ["read"],
            is_active: true,
        },
        mode: "onChange",
    });

    const inviteForm = useForm({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            email: "",
            username: "",
            phone_number: "",
            is_admin: true,
            permissions: ["read", "write"],
            is_active: true,
        },
        mode: "onChange",
    });

    const canSubmit = useMemo(() => {
        const f = tab === "existing" ? existingForm : inviteForm;
        return f.formState.isValid && !submitting;
    }, [tab, existingForm, inviteForm, submitting]);

    const onSubmit = async () => {
        try {
            setSubmitting(true);
            const payload = tab === "existing" ? existingForm.getValues() : inviteForm.getValues();

            // When admin, permissions are ignored server-side; send an empty list for clarity
            const body =
                payload.is_admin
                    ? { ...payload, permissions: [] }
                    : payload;

            const { message } = await superadmin.addStoreStaff(storeId, body);
            toast.success(message || "Staff added successfully.");
            onDone?.();
            onOpenChange?.(false);
            existingForm.reset();
            inviteForm.reset();
        } catch (err) {
            toast.error(err?.message || "Failed to add staff.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[min(720px,100vw)] sm:max-w-[720px] p-0 border-l bg-white/90 backdrop-blur-xl flex h-full flex-col"
            >
                <div
                    className="h-1.5 w-full"
                    style={{ background: "linear-gradient(90deg, var(--primary-color), #059669)" }}
                />

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                    <SheetHeader className="mb-3">
                        <SheetTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-emerald-600" />
                            Add staff {title ? `— ${title}` : ""}
                        </SheetTitle>
                        <SheetDescription>Attach an existing user or send a new invite.</SheetDescription>
                    </SheetHeader>

                    <Tabs value={tab} onValueChange={setTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-black/5 bg-white/70 p-1 backdrop-blur">
                            <TabsTrigger
                                value="existing"
                                className="data-[state=active]:bg-white"
                            >
                                Existing user
                            </TabsTrigger>
                            <TabsTrigger
                                value="invite"
                                className="data-[state=active]:bg-white"
                            >
                                Invite new
                            </TabsTrigger>
                        </TabsList>

                        {/* Existing user */}
                        <TabsContent value="existing" className="mt-3">
                            <Section
                                title="User details"
                                extra={
                                    existingForm.watch("is_admin") && (
                                        <Badge className="flex items-center gap-1 text-white">
                                            <ShieldCheck className="h-3.5 w-3.5" /> Admin
                                        </Badge>
                                    )
                                }
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label>User ID</Label>
                                        <Input placeholder="b11a86… (UUID)" {...existingForm.register("user_id")} />
                                        <p className="text-xs text-neutral-500">
                                            Paste the user’s ID from the Users list.
                                        </p>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <div className="flex items-center gap-2">
                                            <Controller
                                                control={existingForm.control}
                                                name="is_admin"
                                                render={({ field }) => (
                                                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                                                )}
                                            />
                                            <span className="text-sm">Admin</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Controller
                                                control={existingForm.control}
                                                name="is_active"
                                                render={({ field }) => (
                                                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                                                )}
                                            />
                                            <span className="text-sm">Active</span>
                                        </div>
                                    </div>
                                </div>

                                {!existingForm.watch("is_admin") && (
                                    <div>
                                        <Label className="text-xs text-neutral-500">Permissions</Label>
                                        <Controller
                                            control={existingForm.control}
                                            name="permissions"
                                            render={({ field }) => (
                                                <PermissionPicker value={field.value || []} onChange={field.onChange} />
                                            )}
                                        />
                                    </div>
                                )}
                            </Section>
                        </TabsContent>

                        {/* Invite new */}
                        <TabsContent value="invite" className="mt-3">
                            <Section
                                title="Invite details"
                                extra={
                                    inviteForm.watch("is_admin") && (
                                        <Badge className="flex items-center gap-1 text-white">
                                            <ShieldCheck className="h-3.5 w-3.5" /> Admin
                                        </Badge>
                                    )
                                }
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label>Email</Label>
                                        <Input placeholder="user@example.com" {...inviteForm.register("email")} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Username</Label>
                                        <Input placeholder="username" {...inviteForm.register("username")} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Phone (optional)</Label>
                                        <Input placeholder="07…" {...inviteForm.register("phone_number")} />
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <div className="flex items-center gap-2">
                                            <Controller
                                                control={inviteForm.control}
                                                name="is_admin"
                                                render={({ field }) => (
                                                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                                                )}
                                            />
                                            <span className="text-sm">Admin</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Controller
                                                control={inviteForm.control}
                                                name="is_active"
                                                render={({ field }) => (
                                                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                                                )}
                                            />
                                            <span className="text-sm">Active</span>
                                        </div>
                                    </div>
                                </div>

                                {!inviteForm.watch("is_admin") && (
                                    <div>
                                        <Label className="text-xs text-neutral-500">Permissions</Label>
                                        <Controller
                                            control={inviteForm.control}
                                            name="permissions"
                                            render={({ field }) => (
                                                <PermissionPicker value={field.value || []} onChange={field.onChange} />
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Info note about email + temp password */}
                                <div className="mt-2 rounded-xl border border-emerald-200/60 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        <span>
                                            The invitee will receive an email with their temporary password. It’s valid for 24 hours.
                                        </span>
                                    </div>
                                </div>
                            </Section>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Bottom actions (always at the very bottom) */}
                <div className="border-t border-black/5 bg-white/90 p-3 backdrop-blur-sm">
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange?.(false)}
                            className="cursor-pointer px-6 py-4 rounded-4xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={!canSubmit}
                            onClick={onSubmit}
                            className="cursor-pointer text-white px-6 py-4 rounded-4xl"
                        >
                            {submitting ? "Adding…" : "Add staff"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
