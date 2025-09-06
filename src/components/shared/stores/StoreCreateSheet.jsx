import React, { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import StoreForm from "./StoreForm";
import { superadmin } from "@/api";

/** Map rwanda@2.1.5 -> API accepted province names */
const PROVINCE_SUBMIT_MAP = {
    East: "Eastern",
    West: "Western",
    North: "Northern",
    South: "Southern",
    Kigali: "Kigali City",      // ☜ if your API accepts "Kigali" instead, change to "Kigali"
    // also accept already-normalized inputs (no change)
    Eastern: "Eastern",
    Western: "Western",
    Northern: "Northern",
    Southern: "Southern",
    "Kigali City": "Kigali City",
};

/** Only allow permissions your API supports (sample shows read/write) */
const ALLOWED_PERMS = new Set(["read", "write"]);

/** Normalize form values to what the API expects */
function normalizeForAPI(values) {
    const v = { ...values };

    // province label normalization
    if (v.province) {
        const pv = String(v.province).trim();
        v.province = PROVINCE_SUBMIT_MAP[pv] || pv;
    }

    // Trim strings & drop blanks
    ["district", "sector", "cell", "village", "address", "email", "phone_number", "map_url", "name"].forEach((k) => {
        if (typeof v[k] === "string") v[k] = v[k].trim();
    });

    // staff normalization
    if (Array.isArray(v.staff)) {
        v.staff = v.staff
            .filter((s) => s && s.email) // ignore empty rows
            .map((s) => {
                const is_admin = !!s.is_admin;
                const base = {
                    email: s.email?.trim(),
                    username: s.username?.trim() || "",
                    phone_number: s.phone_number?.trim() || "",
                    is_admin,
                    is_active: s.is_active ?? true,
                };
                // only send permissions for non-admins and only allowed values
                if (!is_admin) {
                    base.permissions = (Array.isArray(s.permissions) ? s.permissions : []).filter((p) => ALLOWED_PERMS.has(p));
                }
                return base;
            });
    }

    return v;
}

/** Build FormData that DRF can parse for nested staff list */
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

    // Image (handles both File[] from dropzone and FileList)
    const img = Array.isArray(values.image) ? values.image[0] : values.image?.[0];
    if (img) fd.append("image", img);

    // staff: staff[0][email], staff[0][username], etc.
    if (Array.isArray(values.staff)) {
        values.staff.forEach((s, idx) => {
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

/** Try to extract human-friendly API error from common DRF shapes */
function extractApiError(err) {
    const data = err?.response?.data;
    if (!data) return err?.message || "Failed to create store.";
    if (typeof data === "string") return data;
    if (data.detail) return String(data.detail);

    try {
        const lines = [];
        Object.entries(data).forEach(([field, val]) => {
            if (Array.isArray(val)) lines.push(`${field}: ${val.join(", ")}`);
            else if (typeof val === "object" && val !== null) {
                // nested errors (e.g., staff)
                Object.entries(val).forEach(([k, v]) => {
                    lines.push(`${field}.${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`);
                });
            } else {
                lines.push(`${field}: ${String(val)}`);
            }
        });
        return lines.join("\n");
    } catch {
        return "Validation failed. Please review your inputs.";
    }
}

const StoreCreateSheet = ({ open, onOpenChange, onDone }) => {
    const [submitting, setSubmitting] = useState(false);

    const submit = async (values) => {
        setSubmitting(true);
        try {
            // 1) normalize
            const normalized = normalizeForAPI(values);
            // 2) form-data (for optional image + nested staff)
            const body = buildCreateFormData(normalized);
            // 3) submit
            const res = await superadmin.createStore(body, { asForm: true });
            // success
            // if your API returns message somewhere else, tweak below
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
