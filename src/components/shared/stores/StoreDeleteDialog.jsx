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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ShieldAlert, Store as StoreIcon } from "lucide-react";

const InfoPill = ({ label, value }) => (
    <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200">
        <span className="opacity-70">{label}:</span>
        <span>{value ?? "—"}</span>
    </div>
);

const StoreDeleteDialog = ({ store, open, onOpenChange, onDeleted }) => {
    const [submitting, setSubmitting] = useState(false);

    const [reason, setReason] = useState("duplicate");
    const [otherReason, setOtherReason] = useState("");
    const [ack, setAck] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const name = store?.name || "this store";
    const matchText = (store?.name || "").trim();
    const isMatch = confirmText.trim() === matchText && !!matchText;

    const canDelete = useMemo(() => {
        if (!ack) return false;
        if (!isMatch) return false;
        if (reason === "other" && !otherReason.trim()) return false;
        return true;
    }, [ack, isMatch, reason, otherReason]);

    const resetState = () => {
        setReason("duplicate");
        setOtherReason("");
        setAck(false);
        setConfirmText("");
    };

    const remove = async () => {
        setSubmitting(true);
        try {
            const res = await superadmin.deleteStore(store.id);
            toast.success(res?.message || "Store deleted.");
            onDeleted?.();
            resetState();
        } catch (err) {
            toast.error(err?.message || "Failed to delete store.");
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
                // 👇 Force perfect centering on all screens
                className="
          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[92vw] max-w-[600px]
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
                            Delete store?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="mx-auto max-w-[48ch] text-center text-sm text-neutral-600 dark:text-neutral-300">
                            This action is permanent and may remove related memberships and pending
                            invitations according to backend policy.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="mt-6 rounded-xl border border-neutral-200 bg-white/80 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                <StoreIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
                                    {name}
                                </div>
                                <div className="truncate text-xs text-neutral-500">{store?.id}</div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <InfoPill label="Has admin" value={store?.has_admin ? "Yes" : "No"} />
                                    <InfoPill label="Admins" value={typeof store?.admin_count === "number" ? store.admin_count : "—"} />
                                    <InfoPill label="Staff" value={typeof store?.staff_count === "number" ? store.staff_count : "—"} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Why are you deleting this store?</Label>
                        <RadioGroup value={reason} onValueChange={setReason} className="grid gap-2">
                            {[
                                { id: "duplicate", label: "Duplicate record" },
                                { id: "mistake", label: "Created by mistake" },
                                { id: "closed", label: "Store closed permanently" },
                                { id: "other", label: "Other" },
                            ].map((opt) => (
                                <label
                                    key={opt.id}
                                    htmlFor={`reason-${opt.id}`}
                                    className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white/85 px-3 py-2.5 text-sm transition hover:border-[var(--primary-color)]/40 hover:bg-white dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:bg-neutral-900"
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem id={`reason-${opt.id}`} value={opt.id} />
                                        <span>{opt.label}</span>
                                    </div>
                                </label>
                            ))}
                        </RadioGroup>

                        {reason === "other" && (
                            <div className="grid gap-1.5">
                                <Label htmlFor="other-reason" className="text-xs text-neutral-600 dark:text-neutral-300">
                                    Please describe (required)
                                </Label>
                                <Input
                                    id="other-reason"
                                    placeholder="Brief reason…"
                                    value={otherReason}
                                    onChange={(e) => setOtherReason(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div
                        className="mt-6 space-y-3 rounded-xl border p-4"
                        style={{
                            background: "color-mix(in oklab, var(--primary-color) 5%, white)",
                            borderColor: "color-mix(in oklab, var(--primary-color) 25%, white)",
                        }}
                    >
                        <div className="flex items-start gap-2">
                            <Checkbox
                                id="ack"
                                checked={ack}
                                onCheckedChange={(v) => setAck(Boolean(v))}
                                className="mt-0.5"
                            />
                            <Label htmlFor="ack" className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                                I understand this operation is <span className="font-semibold">irreversible</span> and related data
                                may be removed per backend policy.
                            </Label>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="confirm" className="text-xs text-neutral-600 dark:text-neutral-300">
                                Type the store name exactly to confirm:
                                <span className="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                    {matchText || "—"}
                                </span>
                            </Label>
                            <Input
                                id="confirm"
                                placeholder="Type the store name to enable Delete"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className={
                                    "transition " +
                                    (confirmText
                                        ? isMatch
                                            ? "border-green-500/60 focus-visible:ring-0"
                                            : "border-red-500/60 focus-visible:ring-0"
                                        : "")
                                }
                            />
                            <p
                                className={
                                    "text-xs " +
                                    (confirmText
                                        ? isMatch
                                            ? "text-green-600"
                                            : "text-red-600"
                                        : "text-neutral-500")
                                }
                            >
                                {confirmText
                                    ? isMatch
                                        ? "Name matches."
                                        : "Name must match exactly."
                                    : "Enter the exact store name."}
                            </p>
                        </div>
                    </div>

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
                            {submitting ? "Deleting…" : `Delete "${name}"`}
                        </AlertDialogAction>
                    </AlertDialogFooter>

                    <p className="mt-3 text-center text-[11px] text-neutral-500">
                        Not sure? You can edit the store instead.
                    </p>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default StoreDeleteDialog;
