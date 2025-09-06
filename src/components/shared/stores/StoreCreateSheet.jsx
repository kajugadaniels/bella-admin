import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import StoreForm from "./StoreForm";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const endpoint = `${API_BASE}/api/superadmin/stores/`;

export default function StoreCreateSheet({ open, onOpenChange, onCreated }) {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    const createStore = async (payload /* FormData */) => {
        setSubmitting(true);
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                body: payload,
                credentials: "include",
                headers: (() => {
                    const t = localStorage.getItem("access_token");
                    return t ? { Authorization: `Bearer ${t}` } : {};
                })(),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || "Failed to create store");
            toast({ title: "Store created", description: data?.message || "Successfully created.", duration: 2500 });
            onOpenChange(false);
            onCreated?.();
        } catch (err) {
            toast({ title: "Create failed", description: String(err.message || err), variant: "destructive", duration: 4000 });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>New Store</SheetTitle>
                    <SheetDescription>Create a store. You can optionally add staff now; invites are sent for new emails.</SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                    <StoreForm mode="create" onSubmit={createStore} submitting={submitting} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
