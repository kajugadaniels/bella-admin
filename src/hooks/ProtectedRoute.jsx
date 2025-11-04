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

    // Avoid duplicate toasts in StrictMode
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

    const hasCookieBasedSession = !!user && !token;
    const hasSession = tokenValid || hasCookieBasedSession;
    const role = String(user?.role || "").toUpperCase();

    // PRE-CALCULATED redirects (NO hooks inside conditions)
    let redirectElement = null;

    if (token && !tokenValid) {
        notifyOnce(() =>
            toast.error("Session expired", {
                description: "Please sign in again.",
            })
        );
        clearSession();
        redirectElement = (
            <Navigate to={`${loginUrl}&reason=expired`} replace />
        );
    } else if (!hasSession) {
        notifyOnce(() => toast.error("Please sign in to continue."));
        redirectElement = (
            <Navigate
                to={loginUrl}
                state={{ from: location }}
                replace
            />
        );
    } else if (role !== "admin" && role !== "ADMIN") {
        notifyOnce(() =>
            toast.error("Access denied", {
                description: "This portal is for Admins only.",
            })
        );
        redirectElement = (
            <Navigate
                to="/?error=forbidden"
                state={{ from: location }}
                replace
            />
        );
    }

    // ✅ Hooks ALWAYS before returns
    useEffect(() => {
        const enforce = () => {
            const t = getAccessToken();
            if (t && !isAccessValid()) {
                if (!notifiedRef.current) {
                    toast.error("Session expired", {
                        description: "Please sign in again.",
                    });
                }
                notifiedRef.current = true;
                clearSession();
                navigate(`${loginUrl}&reason=expired`, { replace: true });
            }
        };

        enforce();
        const intervalId = setInterval(enforce, 15000);

        const onStorage = (e) => {
            if (!e || e.key === "bella_session_updated") enforce();
        };
        window.addEventListener("storage", onStorage);

        const onVis = () => {
            if (document.visibilityState === "visible") enforce();
        };
        document.addEventListener("visibilitychange", onVis);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("storage", onStorage);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [navigate, loginUrl]);

    // ✅ Only 1 return
    return redirectElement || <Outlet />;
};

export default ProtectedRoute;
