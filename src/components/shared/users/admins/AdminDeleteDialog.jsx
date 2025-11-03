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
import { ShieldAlert, Shield, User as UserIcon } from "lucide-react";

function extractToastError(err, fallback = "Failed to delete admin") {
    try {
        return err?.response?.data?.message || err?.message || fallback;
    } catch {
        return fallback;
    }
}

const InfoPill = ({ label, value }) => (
    <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-neutral-700">
        <span className="opacity-70">{label}:</span>
        <span>{value ?? "—"}</span>
    </div>
);

export default function AdminDeleteDialog({ admin, open, onOpenChange, onDone }) {
    const [submitting, setSubmitting] = useState(false);

    // normalize common fields
    const id = admin?.id || admin?.user_id || admin?.admin_id;
    const email = admin?.email || admin?.user?.email || "";
    const username = admin?.username || admin?.user?.username || "";
    const role = admin?.role || admin?.user?.role || "ADMIN";
    const isSuperuser = !!(admin?.is_superuser ?? admin?.user?.is_superuser);

    // reasons & confirmation
    const [reason, setReason] = useState("left");
    const [otherReason, setOtherReason] = useState("");
    const [ack, setAck] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const matchText = (email || username || "").trim();
    const isMatch = confirmText.trim() === matchText && !!matchText;

    const canDelete = useMemo(() => {
        if (isSuperuser) return false;
        if (!ack) return false;
        if (!isMatch) return false;
        if (reason === "other" && !otherReason.trim()) return false;
        return true;
    }, [ack, isMatch, reason, otherReason, isSuperuser]);

    const resetState = () => {
        setReason("left");
        setOtherReason("");
        setAck(false);
        setConfirmText("");
    };

    const remove = async () => {
        if (!id) return;
        setSubmitting(true);
        try {
            await superadmin.deleteAdmin(id);
            toast.success("Admin deleted.");
            onDone?.();
            resetState();
        } catch (err) {
            toast.error(extractToastError(err));
        } finally {
            setSubmitting(false);
        }
    };

    const titleName = email || username || "this admin";

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
          w-[92vw] max-w-[600px]
          bg-white/90
          backdrop-blur-xl
          border border-neutral-200/70
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
                            Delete admin?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="mx-auto max-w-[48ch] text-center text-sm text-neutral-600">
                            This action is permanent and may revoke related permissions immediately according to backend policy.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Target summary */}
                    <div className="mt-6 rounded-xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                                <UserIcon className="h-5 w-5 text-neutral-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[15px] font-semibold text-neutral-900">
                                    {titleName}
                                </div>
                                <div className="truncate text-xs text-neutral-500">{id}</div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <InfoPill label="Role" value={role} />
                                    <InfoPill label="Superuser" value={isSuperuser ? "Yes" : "No"} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Reasons */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Why are you deleting this admin?</Label>
                        <RadioGroup value={reason} onValueChange={setReason} className="grid gap-2">
                            {[
                                { id: "left", label: "Left company / no longer needed" },
                                { id: "mistake", label: "Created by mistake" },
                                { id: "duplicate", label: "Duplicate account" },
                                { id: "other", label: "Other" },
                            ].map((opt) => (
                                <label
                                    key={opt.id}
                                    htmlFor={`reason-${opt.id}`}
                                    className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white/85 px-3 py-2.5 text-sm transition hover:border-[var(--primary-color)]/40 hover:bg-white"
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
                                <Label htmlFor="other-reason" className="text-xs text-neutral-600">
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

                    {/* Acknowledgement + exact match */}
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
                            <Label htmlFor="ack" className="text-sm leading-relaxed text-neutral-800">
                                I understand this operation is <span className="font-semibold">irreversible</span> and the account access
                                will be removed immediately.
                            </Label>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="confirm" className="text-xs text-neutral-600">
                                Type the admin’s identifier exactly to confirm:
                                <span className="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-700">
                                    {matchText || "—"}
                                </span>
                            </Label>
                            <Input
                                id="confirm"
                                placeholder="Type the email/username to enable Delete"
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
                                {isMatch
                                    ? "Identifier matches."
                                    : confirmText
                                        ? "Identifier must match exactly."
                                        : "Enter the exact identifier."}
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
                            title={isSuperuser ? "Cannot delete superuser" : undefined}
                            style={{ boxShadow: "0 10px 24px rgba(220, 38, 38, 0.22)" }}
                        >
                            {submitting ? "Deleting…" : `Delete "${titleName || "admin"}"`}
                        </AlertDialogAction>
                    </AlertDialogFooter>

                    {isSuperuser && (
                        <p className="mt-3 text-center text-[11px] text-red-600">
                            This account is a superuser and cannot be deleted.
                        </p>
                    )}
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
