// src/components/shared/stores/StoreUpdateSheet.jsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import StoreForm from "./StoreForm";
import { superadmin } from "@/api";

/* ───────────────────────── Province mapping ───────────────────────── */
/** Backend expects these; rwanda@2.1.5 often shows "Kigali City" in the picker */
const PROVINCE_SUBMIT_MAP = {
    East: "Eastern",
    West: "Western",
    North: "Northern",
    South: "Southern",
    "Kigali City": "Kigali",
    Kigali: "Kigali",
    Eastern: "Eastern",
    Western: "Western",
    Northern: "Northern",
    Southern: "Southern",
};
/** For display in the combobox (what RW.Provinces() likely returns) */
const PROVINCE_DISPLAY_MAP = {
    Kigali: "Kigali City",
    Eastern: "Eastern",
    Western: "Western",
    Northern: "Northern",
    Southern: "Southern",
};
const toSubmitProvince = (v) => (v ? PROVINCE_SUBMIT_MAP[String(v).trim()] || String(v).trim() : "");
const toDisplayProvince = (v) => (v ? PROVINCE_DISPLAY_MAP[String(v).trim()] || String(v).trim() : "");

/* ───────────────────────── Error extractor ───────────────────────── */
function extractToastError(err) {
    if (err && typeof err === "object") {
        if (Array.isArray(err.details) && err.details.length) return err.details.join("\n");
        const d = err.data;
        if (typeof d === "string") return d;
        if (d && typeof d === "object") {
            if (typeof d.detail === "string" && d.detail.trim()) return d.detail;
            if (d.errors && typeof d.errors === "object") {
                try {
                    const lines = [];
                    for (const [k, v] of Object.entries(d.errors)) {
                        if (Array.isArray(v)) v.forEach((s) => lines.push(`${k}: ${s}`));
                        else if (typeof v === "string") lines.push(`${k}: ${v}`);
                    }
                    if (lines.length) return lines.join("\n");
                } catch { }
            }
            try {
                const lines = [];
                for (const [k, v] of Object.entries(d)) {
                    if (Array.isArray(v)) v.forEach((s) => typeof s === "string" && lines.push(`${k}: ${s}`));
                    else if (typeof v === "string") lines.push(`${k}: ${v}`);
                }
                if (lines.length) return lines.join("\n");
            } catch { }
        }
        if (typeof err.message === "string") return err.message;
    }
    return "Something went wrong.";
}

/* ───────────────────────── Normalization ───────────────────────── */
function normalizeUpdate(values) {
    const v = { ...values };

    // Trim simple strings
    ["name", "email", "phone_number", "address", "province", "district", "sector", "cell", "village", "map_url"].forEach((k) => {
        if (typeof v[k] === "string") v[k] = v[k].trim();
    });

    // Province → backend format
    if (v.province) v.province = toSubmitProvince(v.province);

    // Unwrap image to File if array/FileList-like
    if (Array.isArray(v.image)) v.image = v.image[0] || null;
    else if (v.image && typeof v.image === "object" && "0" in v.image) v.image = v.image[0] || null;

    return v;
}

/** Build body for PATCH:
 *  - JSON when no file/remove flag is present
 *  - FormData when image or remove_image are involved
 */
function buildUpdateBody(values) {
    const v = normalizeUpdate(values);
    const hasFile = v.image instanceof File;
    const wantsRemove = !!v.remove_image;

    if (!hasFile && !wantsRemove) {
        const { image, remove_image, ...rest } = v;
        // drop empties
        Object.keys(rest).forEach((k) => {
            if (rest[k] === "" || rest[k] === null || rest[k] === undefined) delete rest[k];
        });
        return rest; // JSON
    }

    const fd = new FormData();
    [
        "name", "email", "phone_number", "address",
        "province", "district", "sector", "cell", "village",
        "map_url",
    ].forEach((k) => {
        const val = v[k];
        if (val !== undefined && val !== null && String(val).trim().length) fd.append(k, val);
    });
    if (hasFile) fd.append("image", v.image);
    if (wantsRemove) fd.append("remove_image", "true");
    return fd; // multipart
}

/* ───────────────────────── Component ───────────────────────── */
const StoreUpdateSheet = ({ id, open, onOpenChange, onDone }) => {
    const [loading, setLoading] = useState(false);
    const [storeDefaults, setStoreDefaults] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Load store details on open/id change
    useEffect(() => {
        if (!open || !id) return;
        (async () => {
            setLoading(true);
            try {
                const res = await superadmin.getStore(id);
                const payload = res?.data?.data; // DRF: { status, data }
                if (!payload) throw new Error("Malformed response.");

                const contact = payload.contact || {};
                const location = payload.location || {};

                setStoreDefaults({
                    name: payload.name || "",
                    email: contact.email || "",
                    phone_number: contact.phone_number || "",
                    address: contact.address || "",
                    province: toDisplayProvince(location.province || ""),
                    district: location.district || "",
                    sector: location.sector || "",
                    cell: location.cell || "",
                    village: location.village || "",
                    map_url: location.map_url || "",
                    image: null,           // no file selected initially
                    remove_image: false,   // default
                });
            } catch (err) {
                toast.error(extractToastError(err) || "Failed to load store.");
                onOpenChange?.(false);
            } finally {
                setLoading(false);
            }
        })();
    }, [open, id, onOpenChange]);

    const onSubmit = async (values) => {
        setSubmitting(true);
        try {
            const body = buildUpdateBody(values);
            const res = await superadmin.updateStore(id, body);
            toast.success(res?.message || "Store updated successfully.");
            onDone?.();
        } catch (err) {
            toast.error(extractToastError(err) || "Failed to update store.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl bg-white/95 backdrop-blur">
                <SheetHeader>
                    <SheetTitle>Update store</SheetTitle>
                </SheetHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="py-12 text-center text-sm text-neutral-500">Loading…</div>
                    ) : storeDefaults ? (
                        <StoreForm
                            mode="update"
                            defaultValues={storeDefaults}
                            submitting={submitting}
                            onSubmit={onSubmit}
                        />
                    ) : (
                        <div className="py-12 text-center text-sm text-neutral-500">No data.</div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default StoreUpdateSheet;
