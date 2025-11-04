import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import StoreForm from "./StoreForm";
import { superadmin, API_BASE } from "@/api";

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
                } catch (error) {
                    console.error("Error extracting nested errors:", error);
                }
            }
            try {
                const lines = [];
                for (const [k, v] of Object.entries(d)) {
                    if (Array.isArray(v)) v.forEach((s) => typeof s === "string" && lines.push(`${k}: ${s}`));
                    else if (typeof v === "string") lines.push(`${k}: ${v}`);
                }
                if (lines.length) return lines.join("\n");
            } catch (error) {
                console.error("Error extracting errors:", error);
            }
        }
        if (typeof err.message === "string") return err.message;
    }
    return "Something went wrong.";
}

/* ───────────────────────── Utilities ───────────────────────── */
/** Try common fields for an image URL, and normalize relative URLs to absolute. */
function pickImageUrl(payload = {}) {
    const candidates = [
        payload.image_url,
        payload.image,
        payload.logo_url,
        payload.logo,
        payload.photo_url,
        payload.photo,
        payload.media?.image_url,
        payload.media?.image,
        payload.image?.url,
    ];
    let u = candidates.find((x) => typeof x === "string" && x.trim().length) || "";
    if (u && !/^https?:\/\//i.test(u)) {
        u = `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
    }
    return u;
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
        const { image: _image, remove_image: _remove_image, ...rest } = v;
        // drop empties
        Object.keys(rest).forEach((k) => {
            if (rest[k] === "" || rest[k] === null || rest[k] === undefined) delete rest[k];
        });
        return rest; // JSON
    }

    const fd = new FormData();
    ["name", "email", "phone_number", "address", "province", "district", "sector", "cell", "village", "map_url"].forEach((k) => {
        const val = v[k];
        if (val !== undefined && val !== null && String(val).trim().length) fd.append(k, val);
    });
    if (hasFile) fd.append("image", v.image);
    if (wantsRemove) fd.append("remove_image", "true");
    return fd; // multipart
}

/* ───────────────────────── Component ───────────────────────── */
const FORM_ID = "store-update-form";

const StoreUpdateSheet = ({ id, open, onOpenChange, onDone }) => {
    const [loading, setLoading] = useState(false);
    const [storeDefaults, setStoreDefaults] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formMeta, setFormMeta] = useState({ isValid: false, isDirty: false });

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
                const image_url = pickImageUrl(payload);

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
                    image: null,          // no new file selected initially
                    remove_image: false,  // default
                    current_image_url: image_url || "", // used for preview
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
            // keep the sheet open to allow further edits; user can Cancel to close
        } catch (err) {
            toast.error(extractToastError(err) || "Failed to update store.");
        } finally {
            setSubmitting(false);
        }
    };

    const canSave = !!storeDefaults && !loading && formMeta.isValid && !submitting;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[min(920px,100vw)] sm:max-w-[920px] p-0 border-l bg-white backdrop-blur-xl"
            >
                {/* Top accent */}
                <div
                    className="h-1.5 w-full"
                    style={{ background: "linear-gradient(90deg, var(--primary-color), #059669)" }}
                />

                {/* Full-height column with scrollable content and pinned footer */}
                <div className="flex h-[calc(100vh-0.375rem)] flex-col">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                        <SheetHeader className="mb-3">
                            <SheetTitle>Update store</SheetTitle>
                        </SheetHeader>

                        {loading ? (
                            <div className="py-12 text-center text-sm text-neutral-500">Loading…</div>
                        ) : storeDefaults ? (
                            <StoreForm
                                key={id} /* ensures RHF resets when a different store is opened */
                                formId={FORM_ID}
                                mode="update"
                                defaultValues={storeDefaults}
                                submitting={submitting}
                                onSubmit={onSubmit}
                                onFormStateChange={setFormMeta}
                                initialImageUrl={storeDefaults.current_image_url}
                            />
                        ) : (
                            <div className="py-12 text-center text-sm text-neutral-500">No data.</div>
                        )}
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
                            <Button
                                type="submit"
                                form={FORM_ID}
                                disabled={!canSave}
                                className="cursor-pointer text-white rounded-4xl px-4 py-5 glass-cta"
                            >
                                {submitting ? "Saving…" : "Save changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default StoreUpdateSheet;
