import React, { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import StoreForm from "./StoreForm";
import { superadmin } from "@/api";

/** Map rwanda@2.1.5 -> API accepted province names (your API accepted "Kigali" in Postman) */
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

/** Only allow permissions your API supports */
const ALLOWED_PERMS = new Set(["read", "write", "edit", "delete"]);

/** Normalize form values to what the API expects (JSON-friendly) */
function normalizeForAPI(values) {
    const v = { ...values };

    // province normalization
    if (v.province) {
        const pv = String(v.province).trim();
        v.province = PROVINCE_SUBMIT_MAP[pv] || pv;
    }

    // Trim strings
    ["district", "sector", "cell", "village", "address", "email", "phone_number", "map_url", "name"].forEach((k) => {
        if (typeof v[k] === "string") v[k] = v[k].trim();
    });

    // unwrap image to a single File if it's an array/FileList
    let imageFile = null;
    if (Array.isArray(v.image)) imageFile = v.image[0] || null;
    else if (v.image && typeof v.image === "object" && "0" in v.image) imageFile = v.image[0] || null;
    else if (v.image instanceof File) imageFile = v.image || null;

    // staff normalization (drop empty rows)
    let staff = [];
    if (Array.isArray(v.staff)) {
        staff = v.staff
            .filter((s) => s && s.email)
            .map((s) => {
                const is_admin = !!s.is_admin;
                const base = {
                    email: s.email?.trim(),
                    username: s.username?.trim() || "",
                    phone_number: s.phone_number?.trim() || "",
                    is_admin,
                    is_active: s.is_active ?? true,
                };
                if (!is_admin) {
                    base.permissions = (Array.isArray(s.permissions) ? s.permissions : []).filter((p) => ALLOWED_PERMS.has(p));
                }
                return base;
            });
    }

    // final JSON payload (no image file here)
    const jsonPayload = {
        name: v.name || "",
        email: v.email || "",
        phone_number: v.phone_number || "",
        address: v.address || "",
        province: v.province || "",
        district: v.district || "",
        sector: v.sector || "",
        cell: v.cell || "",
        village: v.village || "",
        map_url: v.map_url || "",
        staff,
    };

    return { jsonPayload, imageFile };
}

/** Works with fetch-style errors thrown by api.js */
function extractApiError(err) {
    // our api.js throws { ok:false, status, message, details, data }
    if (err && typeof err === "object") {
        if (Array.isArray(err.details) && err.details.length) return err.details.join("\n");
        if (err.data) {
            const d = err.data;
            if (typeof d === "string") return d;
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
    return "Validation failed. Please review your inputs.";
}

const StoreCreateSheet = ({ open, onOpenChange, onDone }) => {
    const [submitting, setSubmitting] = useState(false);

    const submit = async (values) => {
        setSubmitting(true);
        try {
            // 1) Normalize values; split JSON body & image file
            const { jsonPayload, imageFile } = normalizeForAPI(values);

            // 2) Create store with JSON (this is the key change; DRF parses 'staff' correctly)
            // Assumes your superadmin wrapper sets Content-Type: application/json for plain objects.
            const createRes = await superadmin.createStore(jsonPayload);

            // Try common response shapes
            const storeId = createRes?.data?.id ?? createRes?.id ?? createRes?.data?.store?.id;
            if (!storeId) {
                // If backend returns the created store object directly, keep this friendly fallback
                throw new Error("Store created but no ID returned from API.");
            }

            // 3) If image selected, upload it in a separate multipart PATCH
            if (imageFile instanceof File) {
                const fd = new FormData();
                fd.append("image", imageFile);

                // If your wrapper has a specific method, use it; otherwise a generic update works fine.
                // e.g., await superadmin.updateStoreImage(storeId, fd)
                const patchFn = superadmin.updateStore || superadmin.patchStore || superadmin.updateStoreImage;
                if (typeof patchFn === "function") {
                    await patchFn(storeId, fd);
                } else {
                    // Fallback: direct fetch if your wrapper doesn't provide one (adjust URL as needed)
                    const res = await fetch(`/api/superadmin/stores/${storeId}/`, {
                        method: "PATCH",
                        body: fd,
                    });
                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        throw { message: "Image upload failed", data };
                    }
                }
            }

            const msg =
                createRes?.message ||
                createRes?.data?.message ||
                "Store created.";
            toast.success(msg);
            onDone?.();
        } catch (err) {
            toast.error(extractApiError(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl bg-white/95 backdrop-blur">
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
