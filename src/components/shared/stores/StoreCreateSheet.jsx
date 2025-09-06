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

/** Normalize form values to what the API expects */
function normalizeForAPI(values) {
    const v = { ...values };

    // province normalization
    if (v.province) {
        const pv = String(v.province).trim();
        v.province = PROVINCE_SUBMIT_MAP[pv] || pv;
    }

    // Trim strings & drop blanks
    ["district", "sector", "cell", "village", "address", "email", "phone_number", "map_url", "name"].forEach((k) => {
        if (typeof v[k] === "string") v[k] = v[k].trim();
    });

    // unwrap image to a single File if it's an array/FileList
    if (Array.isArray(v.image)) v.image = v.image[0] || null;
    else if (v.image && typeof v.image === "object" && "0" in v.image) v.image = v.image[0] || null;

    // staff normalization
    if (Array.isArray(v.staff)) {
        v.staff = v.staff
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

    return v;
}

/** Build FormData the way DRF parsers like it:
 *  - Simple scalars as normal fields
 *  - image as File
 *  - staff as ONE JSON field (stringified)
 */
function buildCreateFormData(values) {
    const fd = new FormData();

    // Simple fields (skip blanks)
    [
        "name",
        "email",
        "phone_number",
        "address",
        "province",
        "district",
        "sector",
        "cell",
        "village",
        "map_url",
    ].forEach((k) => {
        const v = values[k];
        if (v !== undefined && v !== null && String(v).trim().length) fd.append(k, v);
    });

    // Image
    if (values.image instanceof File) {
        fd.append("image", values.image);
    }

    // staff as JSON (NOT bracket notation)
    if (Array.isArray(values.staff) && values.staff.length) {
        fd.append("staff", JSON.stringify(values.staff));
    }

    return fd;
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
            // fall back to any stringy fields
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
            // 1) normalize
            const normalized = normalizeForAPI(values);
            // 2) form-data (image as File, staff as JSON string)
            const body = buildCreateFormData(normalized);
            // 3) submit
            const res = await superadmin.createStore(body);
            const msg = res?.message || res?.data?.message || "Store created.";
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
