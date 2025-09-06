import React, { useState } from "react";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription, // 👈 add this
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import StoreForm from "./StoreForm";
import { superadmin } from "@/api";

/** Build FormData that DRF can parse for nested staff list */
function buildCreateFormData(values) {
    const fd = new FormData();
    [
        "name", "email", "phone_number", "address",
        "province", "district", "sector", "cell", "village",
        "map_url",
    ].forEach((k) => {
        const v = values[k];
        if (v !== undefined && v !== null && String(v).length) fd.append(k, v);
    });

    const img0 = Array.isArray(values.image) ? values.image[0] : values.image?.[0];
    if (img0) fd.append("image", img0);

    if (Array.isArray(values.staff)) {
        values.staff.forEach((s, idx) => {
            if (!s?.email) return;
            fd.append(`staff[${idx}][email]`, s.email);
            if (s.username) fd.append(`staff[${idx}][username]`, s.username);
            if (s.phone_number) fd.append(`staff[${idx}][phone_number]`, s.phone_number);
            fd.append(`staff[${idx}][is_admin]`, String(!!s.is_admin));
            if (!s.is_admin && Array.isArray(s.permissions)) {
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
            <SheetContent side="right" className="bg-white p-0 sm:max-w-xl flex flex-col">
                <SheetHeader className="px-4 sm:px-5 py-4">
                    <SheetTitle>Create a new store</SheetTitle>
                    {/* 👇 This removes the Radix warning */}
                    <SheetDescription id="create-store-desc">
                        Fill out the form to create a store. All fields are editable later.
                    </SheetDescription>
                </SheetHeader>

                <Separator className="soft-divider" />

                <ScrollArea className="flex-1">
                    <div className="p-4 sm:p-5">
                        <StoreForm mode="create" submitting={submitting} onSubmit={submit} />
                    </div>
                </ScrollArea>

                <div className="sticky bottom-0 z-10 border-t soft-divider bg-white/90 backdrop-blur px-4 sm:px-5 py-3">
                    <div className="text-xs text-neutral-500">
                        Tip: You can invite admins and staff now or add them later.
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default StoreCreateSheet;
