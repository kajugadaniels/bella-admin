import React, { useState } from "react";
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

const StoreDeleteDialog = ({ store, open, onOpenChange, onDeleted }) => {
    const [submitting, setSubmitting] = useState(false);
    const name = store?.name || "this store";

    const remove = async () => {
        setSubmitting(true);
        try {
            const res = await superadmin.deleteStore(store.id);
            toast.success(res?.message || "Store deleted.");
            onDeleted?.();
        } catch (err) {
            toast.error(err?.message || "Failed to delete store.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete store?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete <strong>{name}</strong> and related data
                        as per backend policy (memberships, pending staff, etc.). This action
                        cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={remove}
                        disabled={submitting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {submitting ? "Deleting…" : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default StoreDeleteDialog;
