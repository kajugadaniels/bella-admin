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

const InfoRow = ({ label, value }) => (
    <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-500">{label}</span>
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{value ?? "—"}</span>
    </div>
);

const StoreDeleteDialog = ({ store, open, onOpenChange, onDeleted }) => {
    const [submitting, setSubmitting] = useState(false);

    // Intent checks
    const [reason, setReason] = useState("duplicate");
    const [otherReason, setOtherReason] = useState("");
    const [ack, setAck] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const name = store?.name || "this store";
    const matchText = (store?.name || "").trim();

    const canDelete = useMemo(() => {
        if (!ack) return false;
        if (!matchText) return false;
        if (confirmText.trim() !== matchText) return false;
        if (reason === "other" && !otherReason.trim()) return false;
        return true;
    }, [ack, confirmText, matchText, reason, otherReason]);

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
                className="
          bg-white/80 dark:bg-neutral-900/70
          backdrop-blur-xl
          border border-white/40 dark:border-white/10
          shadow-xl
          sm:max-w-lg
        "
            >
                <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-900/40">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <AlertDialogTitle className="leading-none">Delete store?</AlertDialogTitle>
                            <p className="mt-1 text-xs text-neutral-500">
                                This action is permanent and may remove related memberships and pending invitations per policy.
                            </p>
                        </div>
                    </div>
                </AlertDialogHeader>

                {/* Store snapshot */}
                <div className="rounded-xl border border-neutral-200 bg-white/60 p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50">
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800">
                            <StoreIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{name}</div>
                            <div className="truncate text-xs text-neutral-500">{store?.id}</div>
                        </div>
                    </div>
                    <div className="grid gap-1.5 sm:grid-cols-3">
                        <InfoRow label="Has admin" value={store?.has_admin ? "Yes" : "No"} />
                        <InfoRow label="Admins" value={typeof store?.admin_count === "number" ? store.admin_count : "—"} />
                        <InfoRow label="Staff" value={typeof store?.staff_count === "number" ? store.staff_count : "—"} />
                    </div>
                </div>

                <Separator className="my-3" />

                {/* Reason */}
                <div className="space-y-2">
                    <Label className="text-sm">Why are you deleting this store?</Label>
                    <RadioGroup
                        value={reason}
                        onValueChange={setReason}
                        className="grid gap-2 sm:grid-cols-2"
                    >
                        <div className="flex items-center space-x-2 rounded-lg border p-2 dark:border-neutral-800">
                            <RadioGroupItem value="duplicate" id="reason-dup" />
                            <Label htmlFor="reason-dup" className="text-sm">Duplicate record</Label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-lg border p-2 dark:border-neutral-800">
                            <RadioGroupItem value="mistake" id="reason-mis" />
                            <Label htmlFor="reason-mis" className="text-sm">Created by mistake</Label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-lg border p-2 dark:border-neutral-800">
                            <RadioGroupItem value="closed" id="reason-close" />
                            <Label htmlFor="reason-close" className="text-sm">Store closed permanently</Label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-lg border p-2 dark:border-neutral-800">
                            <RadioGroupItem value="other" id="reason-other" />
                            <Label htmlFor="reason-other" className="text-sm">Other</Label>
                        </div>
                    </RadioGroup>

                    {reason === "other" && (
                        <div className="mt-1">
                            <Label htmlFor="other-reason" className="text-xs text-neutral-500">
                                Please describe (required)
                            </Label>
                            <Input
                                id="other-reason"
                                placeholder="Brief reason…"
                                value={otherReason}
                                onChange={(e) => setOtherReason(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                    )}
                </div>

                {/* Acknowledgement */}
                <div className="mt-3 space-y-2 rounded-xl border border-neutral-200 bg-white/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="ack"
                            checked={ack}
                            onCheckedChange={(v) => setAck(Boolean(v))}
                        />
                        <Label htmlFor="ack" className="text-sm leading-snug">
                            I understand this operation is irreversible and related data may be removed per backend policy.
                        </Label>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="confirm" className="text-xs text-neutral-500">
                            To confirm, type the store name exactly:
                            <span className="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                {matchText}
                            </span>
                        </Label>
                        <Input
                            id="confirm"
                            placeholder="Type the store name to enable Delete"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                        />
                    </div>
                </div>

                <AlertDialogFooter className="mt-2">
                    <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={remove}
                        disabled={!canDelete || submitting}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-60"
                    >
                        {submitting ? "Deleting…" : `Delete "${name}"`}
                    </AlertDialogAction>
                </AlertDialogFooter>

                <AlertDialogDescription className="mt-1 text-[11px] text-neutral-500">
                    Tip: If you’re unsure, consider disabling the store or removing specific members instead.
                </AlertDialogDescription>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default StoreDeleteDialog;
