/* ========================================================================
   API Client for Bella (Auth + Client modules)
   - Normalizes API base to an absolute HTTPS URL
   - Fetch wrapper with timeout, JSON/FormData handling
   - Standard success/error shapes
   - JWT storage (localStorage) and auto attach on auth calls
   - All endpoints from your Django views are mapped here
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
 * @returns {Promise<{ ok: true, status: number, data: T, message?: string } | never>}
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
        return { ok: true, status: res.status, data, message: extractMessage(data) };
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
    authActivate: "/auth/activate/",

    // Client
    clientRegisterRequest: "/client/register/request/",
    clientRegisterConfirm: "/client/register/confirm/",
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
    activate(payload) {
        return POST(endpoints.authActivate, payload, { auth: false });
    },
};

export const client = {
    registerRequest(payload) {
        return POST(endpoints.clientRegisterRequest, payload, { auth: false });
    },
    registerConfirm(payload) {
        return POST(endpoints.clientRegisterConfirm, payload, { auth: false });
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
    client,
};
