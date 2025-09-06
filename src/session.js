// Centralized helpers to manage auth session (tokens + user) in localStorage.
// Works great in dev across micro-frontends when VITE_AUTH_TOKENS_MODE=localstorage.

const ACCESS_KEY = "bella_access";
const REFRESH_KEY = "bella_refresh";
const USER_KEY = "bella_user";

/** Persist tokens + optional user snapshot */
export function saveSession({ tokens, user } = {}) {
    try {
        if (tokens?.access) localStorage.setItem(ACCESS_KEY, tokens.access);
        if (tokens?.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
        // trigger storage event for other tabs on same origin
        localStorage.setItem("bella_session_updated", String(Date.now()));
    } catch { }
}

/** Save/replace just the user snapshot */
export function saveUser(user) {
    try {
        localStorage.setItem(USER_KEY, JSON.stringify(user || null));
        localStorage.setItem("bella_session_updated", String(Date.now()));
    } catch { }
}

/** Read current user snapshot (may be null) */
export function getUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function getAccessToken() {
    try {
        return localStorage.getItem(ACCESS_KEY) || "";
    } catch {
        return "";
    }
}

export function getRefreshToken() {
    try {
        return localStorage.getItem(REFRESH_KEY) || "";
    } catch {
        return "";
    }
}

export function clearSession() {
    try {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.setItem("bella_session_updated", String(Date.now()));
    } catch { }
}

/** Minimal JWT decoder (no signature verification) */
export function decodeJwt(token = "") {
    try {
        const base = token.split(".")[1];
        const payload = JSON.parse(atob(base.replace(/-/g, "+").replace(/_/g, "/")));
        return payload || {};
    } catch {
        return {};
    }
}

/** Returns true if the access token exists and is not expired (±5s skew) */
export function isAccessValid(skewSeconds = 5) {
    const token = getAccessToken();
    if (!token) return false;
    const { exp } = decodeJwt(token);
    if (!exp) return true; // no exp claim; treat as valid
    const now = Math.floor(Date.now() / 1000);
    return now + skewSeconds < Number(exp);
}
