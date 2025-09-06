import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import StoreForm from "./StoreForm";
import { superadmin } from "@/api";

/** Build FormData for PATCH update (image and remove_image supported) */
function buildUpdateBody(values) {
    const hasFile = !!values?.image?.[0];
    const wantsRemove = !!values?.remove_image;

    if (!hasFile && !wantsRemove) {
        // JSON is fine (no file, no remove_image)
        const {
            image, // strip
            ...rest
        } = values || {};
        return { body: rest, asForm: false };
    }

    const fd = new FormData();
    [
        "name", "email", "phone_number", "address",
        "province", "district", "sector", "cell", "village",
        "map_url",
    ].forEach((k) => {
        const v = values[k];
        if (v !== undefined && v !== null && String(v).length) fd.append(k, v);
    });
    if (hasFile) fd.append("image", values.image[0]);
    if (wantsRemove) fd.append("remove_image", "true");

    return { body: fd, asForm: true };
}

const StoreUpdateSheet = ({ id, open, onOpenChange, onDone }) => {
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open || !id) return;
        (async () => {
            setLoading(true);
            try {
                const { data } = await superadmin.getStore(id);
                // Transform backend detail payload to our form defaults
                const d = data || {};
                const vv = d.location || {};
                const cc = d.contact || {};
                setStore({
                    name: d.name || "",
                    email: cc.email || "",
                    phone_number: cc.phone_number || "",
                    address: cc.address || "",
                    province: vv.province || "",
                    district: vv.district || "",
                    sector: vv.sector || "",
                    cell: vv.cell || "",
                    village: vv.village || "",
                    map_url: vv.map_url || "",
                    image: null,
                    remove_image: false,
                });
            } catch (err) {
                toast.error(err?.message || "Failed to load store.");
                onOpenChange?.(false);
            } finally {
                setLoading(false);
            }
        })();
    }, [open, id, onOpenChange]);

    const submit = async (values) => {
        setSubmitting(true);
        try {
            const { body, asForm } = buildUpdateBody(values);
            const res = await superadmin.updateStore(id, body, { asForm });
            toast.success(res?.message || "Store updated.");
            onDone?.();
        } catch (err) {
            toast.error(err?.message || "Failed to update store.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle>Update store</SheetTitle>
                </SheetHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="py-12 text-center text-sm text-neutral-500">Loading…</div>
                    ) : (
                        <StoreForm
                            mode="update"
                            defaultValues={store}
                            submitting={submitting}
                            onSubmit={submit}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default StoreUpdateSheet;
