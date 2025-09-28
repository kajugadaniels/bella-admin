import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { superadmin } from "@/api";
import { Loader2 } from "lucide-react";

function extractToastError(err, fallback = "Failed to delete admin") {
    try {
        return err?.response?.data?.message || err?.message || fallback;
    } catch {
        return fallback;
    }
}

export default function AdminDeleteDialog({ admin, open, onOpenChange, onDone }) {
    const [loading, setLoading] = useState(false);
    const id = admin?.id || admin?.user_id || admin?.admin_id;

    const onConfirm = async () => {
        if (!id) return;
        setLoading(true);
        try {
            await superadmin.deleteAdmin(id);
            toast.success("Admin deleted.");
            onDone?.();
        } catch (err) {
            toast.error(extractToastError(err));
        } finally {
            setLoading(false);
        }
    };

    const email = admin?.email || admin?.user?.email || "this admin";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete admin</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. You are about to permanently delete <strong>{email}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange?.(false)} className="glass-button">Cancel</Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={loading} className="glass-button">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
