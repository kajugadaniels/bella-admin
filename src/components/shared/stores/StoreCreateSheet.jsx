import React, { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import StoreForm from "./StoreForm";
import { superadmin } from "@/api";

/** Build FormData that DRF can parse for nested staff list */
function buildCreateFormData(values) {
    const fd = new FormData();
    // Simple fields
    [
        "name", "email", "phone_number", "address",
        "province", "district", "sector", "cell", "village",
        "map_url",
    ].forEach((k) => {
        const v = values[k];
        if (v !== undefined && v !== null && String(v).length) fd.append(k, v);
    });
    if (values.image?.[0]) {
        fd.append("image", values.image[0]);
    }
    // staff: staff[0][email], staff[0][username], etc.
    if (Array.isArray(values.staff)) {
        values.staff.forEach((s, idx) => {
            if (!s?.email) return;
            fd.append(`staff[${idx}][email]`, s.email);
            if (s.username) fd.append(`staff[${idx}][username]`, s.username);
            if (s.phone_number) fd.append(`staff[${idx}][phone_number]`, s.phone_number);
            fd.append(`staff[${idx}][is_admin]`, String(!!s.is_admin));
            if (Array.isArray(s.permissions)) {
                s.permissions.forEach((p, j) => fd.append(`staff[${idx}][permissions][${j}]`, p));
            }
            fd.append(`staff[${idx}][is_active]`, String(s.is_active ?? true));
        });
    }
    return fd;
}

const StoreCreateSheet = ({ open, onOpenChange, onDone }) => {
    const [submitting, setSubmitting] = useState(false);

    const submit = async (values) => {
        setSubmitting(true);
        try {
            // Use FormData to support optional image + nested staff
            const body = buildCreateFormData(values);
            const res = await superadmin.createStore(body, { asForm: true });
            toast.success(res?.message || "Store created.");
            onDone?.();
        } catch (err) {
            toast.error(err?.message || "Failed to create store.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle>Create a new store</SheetTitle>
                </SheetHeader>

                <div className="py-4">
                    <StoreForm mode="create" submitting={submitting} onSubmit={submit} />
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default StoreCreateSheet;
