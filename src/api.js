/* ========================================================================
   API Client for Bella (Auth + Superadmin modules)
   - Normalizes API base to an absolute HTTPS URL
   - Fetch wrapper with timeout, JSON/FormData handling
   - Standard success/error shapes
   - JWT storage (localStorage) and auto attach on auth calls
   - Maps all Django endpoints (auth + superadmin)
   ======================================================================== */

/** Normalize base to absolute https and strip trailing slashes */
function normalizeApiBase(raw) {
    const v = String(raw || "").trim();
    if (!v) return "";
    // already absolute?
    if (/^https?:\/\//i.test(v)) return v.replace(/\/+$/, "");
    // fallback: assume https if scheme missing
    return `https://${v.replace(/\/+$/, "")}`;
}

/** Resolve the API base from .env */
const RAW_BASE = import.meta.env.VITE_API_BASE_URL;
export const API_BASE = normalizeApiBase(RAW_BASE);

/** Guard: fail fast if still not absolute (prevents relative POST -> 405 on Vercel) */
(function assertAbsolute() {
    if (!/^https?:\/\//i.test(API_BASE)) {
        // eslint-disable-next-line no-console
        console.error(
            "[API] VITE_API_BASE_URL is not absolute. Got:",
            RAW_BASE,
            "=> resolved API_BASE:",
            API_BASE
        );
        throw new Error(
            "Invalid VITE_API_BASE_URL. It must be an absolute URL, e.g. https://bella-erp-api.onrender.com/api"
        );
    }
})();

/** When cookie SSO is enabled, send credentials with requests */
export const TOKENS_MODE = (import.meta.env.VITE_AUTH_TOKENS_MODE || "localstorage").toLowerCase();

/** LocalStorage keys for JWTs */
const ACCESS_KEY = "bella_access";
const REFRESH_KEY = "bella_refresh";

/** ------------------------------------------------------------------------
 * Token utilities
 * --------------------------------------------------------------------- */
export function setTokens(tokens = {}) {
    if (tokens.access) localStorage.setItem(ACCESS_KEY, tokens.access);
    if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
}
export function getTokens() {
    return {
        access: localStorage.getItem(ACCESS_KEY) || "",
        refresh: localStorage.getItem(REFRESH_KEY) || "",
    };
}
export function clearTokens() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
}
/** Convenient header builder for authorized requests */
function authHeaders() {
    const { access } = getTokens();
    return access ? { Authorization: `Bearer ${access}` } : {};
}

/** Join base + path safely */
function url(path) {
    const p = String(path || "");
    return `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
}

/** Build query string from an object.
 *  - Skips null/undefined/"" (except boolean false and 0)
 *  - Arrays are appended as repeated keys: ?k=v1&k=v2
 */
function toQuery(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (Array.isArray(v)) {
            v.forEach((item) => {
                if (item === undefined || item === null || item === "") return;
                qs.append(k, String(item));
            });
            return;
        }
        if (v === "" && v !== 0) return;
        if (typeof v === "boolean") {
            qs.set(k, v ? "true" : "false");
        } else {
            qs.set(k, String(v));
        }
    });
    const s = qs.toString();
    return s ? `?${s}` : "";
}

/** Detect File/Blob to decide multipart vs JSON */
function isFileLike(x) {
    return (typeof File !== "undefined" && x instanceof File) ||
        (typeof Blob !== "undefined" && x instanceof Blob);
}

/** Convert a plain object to FormData.
 *  - Files/Blobs appended raw
 *  - Arrays/objects JSON.stringified (e.g., `staff` or `stockins` payloads)
 */
function toFormData(payload = {}) {
    const fd = new FormData();
    Object.entries(payload || {}).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (isFileLike(v)) {
            fd.append(k, v);
        } else if (Array.isArray(v) || (typeof v === "object" && v !== null)) {
            fd.append(k, JSON.stringify(v));
        } else {
            fd.append(k, String(v));
        }
    });
    return fd;
}

/** If any top-level value is File/Blob, use multipart; else JSON */
function maybeMultipart(payload) {
    if (!payload || typeof payload !== "object") return payload;
    const hasFile =
        Object.values(payload).some((v) => isFileLike(v));
    return hasFile ? toFormData(payload) : payload;
}

/** ------------------------------------------------------------------------
 * Low-level fetch helper
 * --------------------------------------------------------------------- */

/** Extract a human message from backend JSON. */
function extractMessage(json) {
    if (!json || typeof json !== "object") return undefined;
    if (typeof json.message === "string" && json.message.trim()) return json.message;
    if (typeof json.detail === "string" && json.detail.trim()) return json.detail;

    if (json.errors && typeof json.errors === "object") {
        for (const k of Object.keys(json.errors)) {
            const v = json.errors[k];
            if (Array.isArray(v) && typeof v[0] === "string") return v[0];
            if (typeof v === "string") return v;
        }
    }
    return undefined;
}

/** Extract a flat list of error details from DRF responses (for UI lists). */
function extractDetailsList(json) {
    const list = [];
    if (!json || typeof json !== "object") return list;

    if (json.errors && Array.isArray(json.errors.detail)) {
        json.errors.detail.forEach((s) => typeof s === "string" && list.push(s));
    }
    if (json.errors && typeof json.errors === "object") {
        for (const [k, v] of Object.entries(json.errors)) {
            if (k === "detail") continue;
            if (Array.isArray(v)) v.forEach((s) => typeof s === "string" && list.push(`${k}: ${s}`));
            else if (typeof v === "string") list.push(`${k}: ${v}`);
        }
    }
    if (!list.length && typeof json.detail === "string" && json.detail.trim()) {
        list.push(json.detail);
    }
    return list;
}

/**
 * Core request helper.
 * - Automatically sets JSON headers unless body is FormData
 * - Supports auth header when options.auth === true
 * - Adds a timeout via AbortController (default 20s)
 * - Parses JSON and returns a standardized shape
 *
 * @template T
 * @param {string} path - e.g. "/auth/login/"
 * @param {object} [opts]
 * @param {"GET"|"POST"|"PUT"|"PATCH"|"DELETE"|"OPTIONS"} [opts.method="GET"]
 * @param {Record<string, any>|FormData|undefined} [opts.body]
 * @param {Record<string,string>} [opts.headers]
 * @param {boolean} [opts.auth=false]
 * @param {number} [opts.timeout=20000]
 * @returns {Promise<{ ok: true, status: number, data: T, message?: string, headers: Record<string,string> } | never>}
 * @throws {{ ok:false, status:number, message?:string, errors?:any, details?:string[], data?:any }}
 */
export async function apiRequest(path, opts = {}) {
    const { method = "GET", body, headers = {}, auth = false, timeout = 20000 } = opts;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeout);

    const finalUrl = url(path);

    /** Build headers */
    const baseHeaders = {
        Accept: "application/json",
        ...(auth ? authHeaders() : {}),
        ...headers,
    };

    /** Serialize body */
    let payload = undefined;
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined) {
        if (isForm) {
            payload = body; // browser sets multipart boundaries
        } else {
            baseHeaders["Content-Type"] = "application/json";
            payload = JSON.stringify(body);
        }
    }

    let res;
    try {
        res = await fetch(finalUrl, {
            method,
            headers: baseHeaders,
            body: payload,
            signal: ac.signal,
            credentials: TOKENS_MODE === "cookie" ? "include" : "omit",
        });
    } catch (err) {
        clearTimeout(timer);
        throw {
            ok: false,
            status: 0,
            message:
                err?.name === "AbortError"
                    ? "Request timed out. Please try again."
                    : "Network error. Please check your connection.",
            details: [],
        };
    } finally {
        clearTimeout(timer);
    }

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");

    if (res.ok) {
        // Auto-save tokens if present
        if (data && typeof data === "object" && data.tokens && (data.tokens.access || data.tokens.refresh)) {
            setTokens(data.tokens);
        }
        // expose headers to callers (non-breaking addition)
        const headersObj = {};
        try {
            for (const [k, v] of res.headers.entries()) headersObj[k.toLowerCase()] = v;
        } catch { /* no-op */ }

        return { ok: true, status: res.status, data, message: extractMessage(data), headers: headersObj };
    }

    // Normalize errors with details[]
    const errObj = {
        ok: false,
        status: res.status,
        message: extractMessage(data) || `Request failed with status ${res.status}`,
        errors: (data && data.errors) || undefined,
        details: extractDetailsList(data),
        data,
    };
    throw errObj;
}

/** Convenience HTTP verbs */
const GET = (path, opts = {}) => apiRequest(path, { ...opts, method: "GET" });
const POST = (path, body, opts = {}) => apiRequest(path, { ...opts, method: "POST", body });
const PATCH = (path, body, opts = {}) => apiRequest(path, { ...opts, method: "PATCH", body });
const DELETE = (path, opts = {}) => apiRequest(path, { ...opts, method: "DELETE" });

/** ------------------------------------------------------------------------
 * Endpoints map (single source of truth)
 * --------------------------------------------------------------------- */
export const endpoints = {
    // Auth
    authRegisterRequest: "/auth/register/request/",
    authRegisterConfirm: "/auth/register/confirm/",
    authLogin: "/auth/login/",
    authLogout: "/auth/logout/",
    authLogoutAll: "/auth/logout/all/",
    authProfile: "/auth/profile/",
    authChangePassword: "/auth/password/change/",
    authPasswordResetRequest: "/auth/password/reset/request/",
    authPasswordResetConfirm: "/auth/password/reset/confirm/",

    // Superadmin (mounted exactly as in Django URLs)
    // Stores
    saStoresList: "/superadmin/stores/",
    saStoreCreate: "/superadmin/store/add/",
    saStoreDetail: (storeId) => `/superadmin/store/${storeId}/`,
    saStoreUpdate: (storeId) => `/superadmin/store/${storeId}/update/`,
    saStoreDelete: (storeId) => `/superadmin/store/${storeId}/delete/`,
    saStoreStaffAdd: (storeId) => `/superadmin/store/${storeId}/staff/add/`,
    saStoreStaffDelete: (storeId, staffId) => `/superadmin/store/${storeId}/staff/${staffId}/`,

    // Products via StockIn (listing one row per inbound batch)
    saProductsViaStockIn: "/superadmin/products/",

    // Product detail + CRUD
    saProductDetail: (productId) => `/superadmin/product/${productId}/`,
    saProductCreateWithStockIn: "/superadmin/product/add/",
    saProductUpdate: (productId) => `/superadmin/product/${productId}/update/`,

    // StockIn (batch) detail + void + delete
    saStockInDetail: (stockinId) => `/superadmin/stockin/${stockinId}/`,
    saStockInVoid: (stockinId) => `/superadmin/stockin/${stockinId}/void/`,
    saStockInDelete: (stockinId) => `/superadmin/stockin/${stockinId}/delete/`,

    // NEW: Publish + Categories
    saProductPublishSingle: (productId) => `/superadmin/product/${productId}/publish/`,
    saProductsPublish: "/superadmin/products/publish/",
    saProductCategories: "/superadmin/product-categories/",
};

/** ------------------------------------------------------------------------
 * Feature modules
 * --------------------------------------------------------------------- */
export const auth = {
    registerRequest(payload) {
        return POST(endpoints.authRegisterRequest, payload, { auth: false });
    },
    registerConfirm(payload) {
        return POST(endpoints.authRegisterConfirm, payload, { auth: false });
    },
    login(payload) {
        return POST(endpoints.authLogin, payload, { auth: false });
    },
    async logout(payload = {}) {
        const body = { refresh: payload.refresh || getTokens().refresh };
        const res = await POST(endpoints.authLogout, body, { auth: true });
        clearTokens();
        return res;
    },
    async logoutAll() {
        const res = await POST(endpoints.authLogoutAll, {}, { auth: true });
        clearTokens();
        return res;
    },
    getProfile() {
        return GET(endpoints.authProfile, { auth: true });
    },
    updateProfile(data) {
        return PATCH(endpoints.authProfile, data, { auth: true });
    },
    changePassword(payload) {
        return POST(endpoints.authChangePassword, payload, { auth: true });
    },
    passwordResetRequest(payload) {
        return POST(endpoints.authPasswordResetRequest, payload, { auth: false });
    },
    passwordResetConfirm(payload) {
        return POST(endpoints.authPasswordResetConfirm, payload, { auth: false });
    },
};

/** ------------------------------------------------------------------------
 * Superadmin module (ADMIN-only on the backend via IsAdminRole)
 * Notes:
 *  - All calls set { auth: true } so the server can authorize and enforce role=ADMIN.
 *  - Query params mirror your DRF filtersets (stores & stockin listing).
 *  - Arrays/objects are JSON.stringified automatically in multipart via toFormData().
 * --------------------------------------------------------------------- */
export const superadmin = {
    /**
     * List stores with search/filters/order/pagination
     * Mirrors StoreListView (django-filters + DRF backends)
     * @param {Object} params
     */
    listStores(params = {}) {
        return GET(`${endpoints.saStoresList}${toQuery(params)}`, { auth: true });
    },

    /**
     * Create a store (optionally with staff invites + image)
     * Accepts JSON or multipart (image upload). Arrays/objects are JSON.stringified in multipart.
     */
    createStore(payload) {
        const body = payload instanceof FormData ? payload : maybeMultipart(payload);
        return POST(endpoints.saStoreCreate, body, { auth: true });
    },

    /** Get store detail */
    getStore(storeId) {
        return GET(endpoints.saStoreDetail(storeId), { auth: true });
    },

    /**
     * Update store (PATCH). Supports JSON or multipart.
     * Fields: name, email, phone_number, address, province, district, sector, cell, village, map_url,
     *         image (file), remove_image (bool)
     */
    updateStore(storeId, payload) {
        const body = payload instanceof FormData ? payload : maybeMultipart(payload);
        return PATCH(endpoints.saStoreUpdate(storeId), body, { auth: true });
    },

    /** Delete store (hard delete with cascade semantics handled server-side) */
    deleteStore(storeId) {
        return DELETE(endpoints.saStoreDelete(storeId), { auth: true });
    },

    /**
     * Add store staff (existing user or invite new)
     * Existing: { user_id, is_admin?, permissions?, is_active? }
     * Invite:   { email, username, phone_number, password, confirm_password, is_admin?, permissions?, is_active? }
     */
    addStoreStaff(storeId, payload) {
        return POST(endpoints.saStoreStaffAdd(storeId), payload, { auth: true });
    },

    /**
     * List products via StockIn (one row per inbound batch) with filters/search/order/pagination
     * Mirrors StockInProductListView + StockInProductFilter
     * @param {Object} params
     */
    listProductsViaStockIn(params = {}) {
        return GET(`${endpoints.saProductsViaStockIn}${toQuery(params)}`, { auth: true });
    },

    /**
     * Product detail (rich) with optional query params
     * @param {string} productId
     * @param {{ limit_batches?: number, limit_stockouts?: number, include_void?: boolean }} [params]
     */
    getProductDetail(productId, params = {}) {
        return GET(`${endpoints.saProductDetail(productId)}${toQuery(params)}`, { auth: true });
    },

    /**
     * Create product + initial StockIn batches (JSON **or multipart** for image upload).
     * payload: {
     *   name: string,
     *   category: string,
     *   unit_price: number|string,
     *   image?: File,                // optional
     *   publish?: boolean,           // optional
     *   stockins: Array<{ store_id?: string, quantity: number|string, expiry_date?: string (YYYY-MM-DD), is_void?: boolean }>
     * }
     * Note: when using multipart, arrays/objects are JSON.stringified automatically.
     */
    createProductWithStockIn(payload) {
        const body = payload instanceof FormData ? payload : maybeMultipart(payload);
        return POST(endpoints.saProductCreateWithStockIn, body, { auth: true });
    },

    /**
     * Update product (PATCH). JSON or multipart (image upload).
     * Fields: name, sku, barcode, category, brand, unit_of_measure, unit_price, tax_rate (percent),
     *         image (file), remove_image (bool), description, is_active, publish?
     * Also supports batch edits via:
     *         stockins: [{ id: string, quantity?: number|string, expiry_date?: string, store_id?: string }]
     * (Arrays/objects are JSON.stringified automatically in multipart.)
     */
    updateProduct(productId, payload) {
        const body = payload instanceof FormData ? payload : maybeMultipart(payload);
        return PATCH(endpoints.saProductUpdate(productId), body, { auth: true });
    },

    /**
     * StockIn (batch) detail
     * @param {string} stockinId
     * @param {{ include_void?: boolean, limit_stockouts?: number }} [params]
     */
    getStockInDetail(stockinId, params = {}) {
        return GET(`${endpoints.saStockInDetail(stockinId)}${toQuery(params)}`, { auth: true });
    },

    /**
     * Void / unvoid a StockIn batch
     * body: { is_void: true|false, cascade?: true|false }
     */
    voidStockIn(stockinId, body) {
        return PATCH(endpoints.saStockInVoid(stockinId), body, { auth: true });
    },

    /**
     * Hard delete a StockIn batch
     * @param {string} stockinId
     * @param {{ cascade?: boolean }} [opts]
     */
    deleteStockIn(stockinId, opts = {}) {
        const q = toQuery({ cascade: !!opts.cascade });
        return DELETE(`${endpoints.saStockInDelete(stockinId)}${q}`, { auth: true });
    },

    /** Publish a single product */
    publishProduct(productId) {
        return PATCH(endpoints.saProductPublishSingle(productId), {}, { auth: true });
    },

    /**
     * Publish multiple products
     * @param {string[]} ids
     * @param {boolean} [strict=false] - when true, fail if any id is missing
     */
    publishProducts(ids, strict = false) {
        return PATCH(endpoints.saProductsPublish, { ids, strict }, { auth: true });
    },

    /** Get all product categories (enum values from backend) */
    getProductCategories() {
        return GET(endpoints.saProductCategories, { auth: true });
    },
};

export default {
    API_BASE,
    TOKENS_MODE,
    endpoints,
    apiRequest,
    setTokens,
    getTokens,
    clearTokens,
    auth,
    superadmin,
};
