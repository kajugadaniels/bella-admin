import React, { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { superadmin } from "@/api";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert, UserMinus } from "lucide-react";

function extractToastError(err, fallback = "Failed to delete member") {
    try {
        return err?.response?.data?.message || err?.message || fallback;
    } catch {
        return fallback;
    }
}

export default function StoreMemberDeleteDialog({ member, open, onOpenChange, onDone }) {
    const [submitting, setSubmitting] = useState(false);
    const [allowLastAdmin, setAllowLastAdmin] = useState(false);

    const id = member?.id || member?.membership_id;
    const email = member?.user?.email || member?.user_email || "this member";
    const isAdmin = !!member?.is_admin;

    const canDelete = useMemo(() => true, []);

    const resetState = () => setAllowLastAdmin(false);

    const remove = async () => {
        if (!id) return;
        setSubmitting(true);
        try {
            await superadmin.deleteStoreMember(id, { allow_last_admin: !!allowLastAdmin });
            toast.success("Membership deleted.");
            onDone?.();
            resetState();
        } catch (err) {
            toast.error(extractToastError(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AlertDialog
            open={open}
            onOpenChange={(o) => {
                if (!o) resetState();
                onOpenChange?.(o);
            }}
        >
            <AlertDialogContent
                className="
          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[92vw] max-w-[560px]
          bg-white/90 dark:bg-neutral-900/85
          backdrop-blur-xl
          border border-neutral-200/70 dark:border-neutral-800
          shadow-2xl rounded-2xl p-0
          focus:outline-none
        "
            >
                <div className="p-6">
                    <AlertDialogHeader className="space-y-3">
                        <div
                            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
                            style={{
                                background: "color-mix(in oklab, var(--primary-color) 12%, white)",
                                color: "var(--primary-color)",
                                boxShadow: "0 8px 24px rgba(31,79,61,0.10)",
                            }}
                        >
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <AlertDialogTitle className="text-center text-[18px] font-semibold tracking-tight">
                            Remove store member?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="mx-auto max-w-[48ch] text-center text-sm text-neutral-600 dark:text-neutral-300">
                            This detaches <strong>{email}</strong> from the store. The operation is immediate and cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {isAdmin && (
                        <div
                            className="mt-6 space-y-3 rounded-xl border p-4"
                            style={{
                                background: "color-mix(in oklab, var(--primary-color) 5%, white)",
                                borderColor: "color-mix(in oklab, var(--primary-color) 25%, white)",
                            }}
                        >
                            <label className="flex items-start gap-3">
                                <Checkbox
                                    id="allow-last-admin"
                                    checked={allowLastAdmin}
                                    onCheckedChange={(v) => setAllowLastAdmin(Boolean(v))}
                                    className="mt-0.5"
                                />
                                <div>
                                    <Label htmlFor="allow-last-admin" className="text-sm">
                                        Allow removing even if this is the <span className="font-semibold">last admin</span>
                                    </Label>
                                    <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                                        Only use this if you are certain the store will keep proper management.
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}

                    <AlertDialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <AlertDialogCancel disabled={submitting} className="cursor-pointer px-6 py-4 rounded-4xl">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={remove}
                            disabled={!canDelete || submitting}
                            className="px-6 py-4 rounded-4xl glass-cta-danger disabled:opacity-60 text-white cursor-pointer"
                            style={{ boxShadow: "0 10px 24px rgba(220, 38, 38, 0.22)" }}
                        >
                            {submitting ? "Removing…" : (
                                <span className="inline-flex items-center gap-2">
                                    <UserMinus className="h-4 w-4" /> Remove member
                                </span>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
