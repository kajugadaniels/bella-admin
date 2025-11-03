import React, { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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

    // final JSON payload
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

const FORM_ID = "store-create-form";

const StoreCreateSheet = ({ open, onOpenChange, onDone }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formMeta, setFormMeta] = useState({ isValid: false, isDirty: false });

    const submit = async (values) => {
        setSubmitting(true);
        try {
            // 1) Normalize values; include image directly in payload if provided
            const { jsonPayload, imageFile } = normalizeForAPI(values);
            const payload = imageFile instanceof File ? { ...jsonPayload, image: imageFile } : jsonPayload;

            // 2) Create store (JSON or multipart decided automatically by api client)
            const createRes = await superadmin.createStore(payload);

            // 3) Success UI
            const msg = createRes?.message || createRes?.data?.message || "Store created.";
            toast.success(msg);

            // Notify parent to refresh list, etc.
            onDone?.();
            // Keep sheet open by design; use Cancel to close.
        } catch (err) {
            toast.error(extractApiError(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[min(920px,100vw)] sm:max-w-[920px] p-0 border-l bg-white backdrop-blur-xl"
            >
                {/* Top accent */}
                <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--primary-color), #059669)" }} />

                {/* Full-height column with scrollable content and pinned footer */}
                <div className="flex h-[calc(100vh-0.375rem)] flex-col">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                        <SheetHeader className="mb-3">
                            <SheetTitle>Create a new store</SheetTitle>
                        </SheetHeader>

                        <StoreForm
                            formId={FORM_ID}
                            mode="create"
                            submitting={submitting}
                            onSubmit={submit}
                            onFormStateChange={setFormMeta}
                        />
                    </div>

                    {/* Bottom actions — pinned at the very bottom of the sheet */}
                    <div className="sticky bottom-0 mt-4 rounded-none border-t border-black/5 bg-white/90 p-3 backdrop-blur-sm">
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => onOpenChange?.(false)}
                                className="cursor-pointer rounded-4xl px-4 py-5"
                            >
                                Cancel
                            </Button>

                            {/* This button submits the child form via HTML form attribute */}
                            <Button
                                type="submit"
                                form={FORM_ID}
                                disabled={submitting || !formMeta.isValid}
                                className="cursor-pointer text-white rounded-4xl px-4 py-5 glass-cta"
                            >
                                {submitting ? "Saving…" : "Save store"}
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default StoreCreateSheet;
