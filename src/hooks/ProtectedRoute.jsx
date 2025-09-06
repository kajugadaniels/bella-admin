import React, { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    isAccessValid,
    getUser,
    getAccessToken,
    clearSession,
} from "@/session";

const ProtectedRoute = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const notifiedRef = useRef(false);

    // Avoid duplicate toasts (e.g., StrictMode)
    const notifyOnce = (fn) => {
        if (notifiedRef.current) return;
        notifiedRef.current = true;
        fn();
    };

    const next = `${location.pathname}${location.search || ""}${location.hash || ""}`;
    const loginUrl = `/?next=${encodeURIComponent(next)}`;

    const token = getAccessToken();
    const tokenValid = isAccessValid();
    const user = getUser();

    // If a token exists but is invalid, force logout immediately.
    if (token && !tokenValid) {
        notifyOnce(() =>
            toast.error("Session expired", { description: "Please sign in again." })
        );
        clearSession();
        return <Navigate to={`${loginUrl}&reason=expired`} replace />;
    }

    // If no valid session, redirect to login.
    const hasCookieBasedSession = !!user && !token; // allow cookie-based auth if you use it
    const hasSession = tokenValid || hasCookieBasedSession;

    if (!hasSession) {
        notifyOnce(() => toast.error("Please sign in to continue."));
        return <Navigate to={loginUrl} state={{ from: location }} replace />;
    }

    // Role gate
    const role = String(user?.role || "").toUpperCase();
    if (role !== "ADMIN") {
        notifyOnce(() =>
            toast.error("Access denied", { description: "This portal is for Admins only." })
        );
        return <Navigate to="/?error=forbidden" state={{ from: location }} replace />;
    }

    // Background watchers: token expiry mid-session, cross-tab changes, tab visibility
    useEffect(() => {
        const enforce = () => {
            const t = getAccessToken();
            if (t && !isAccessValid()) {
                if (!notifiedRef.current) {
                    toast.error("Session expired", { description: "Please sign in again." });
                }
                notifiedRef.current = true;
                clearSession();
                navigate(`${loginUrl}&reason=expired`, { replace: true });
            }
        };

        // Check on mount and then at intervals
        enforce();
        const id = setInterval(enforce, 15000); // 15s heartbeat

        // Cross-tab/session updates
        const onStorage = (e) => {
            if (!e || e.key === "bella_session_updated") enforce();
        };
        window.addEventListener("storage", onStorage);

        // When tab becomes active again
        const onVis = () => {
            if (document.visibilityState === "visible") enforce();
        };
        document.addEventListener("visibilitychange", onVis);

        return () => {
            clearInterval(id);
            window.removeEventListener("storage", onStorage);
            document.removeEventListener("visibilitychange", onVis);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, loginUrl]);

    return <Outlet />;
};

export default ProtectedRoute;
