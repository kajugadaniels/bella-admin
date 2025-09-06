// src/hooks/ProtectedRoute.jsx
import React, { useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { isAccessValid, getUser } from "@/session";

const ProtectedRoute = () => {
    const location = useLocation();
    const notifiedRef = useRef(false);

    // Helper to avoid duplicate toasts (e.g., StrictMode double render)
    const notifyOnce = (fn) => {
        if (notifiedRef.current) return;
        notifiedRef.current = true;
        fn();
    };

    const user = getUser();
    const hasToken = isAccessValid();              // true when access token exists and isn't expired
    const hasSession = hasToken || !!user;         // support cookie-based auth where user snapshot is present

    const next = `${location.pathname}${location.search || ""}${location.hash || ""}`;
    const loginUrl = `/?next=${encodeURIComponent(next)}`;

    // 1) Not signed in
    if (!hasSession) {
        notifyOnce(() => toast.error("Please sign in to continue."));
        return <Navigate to={loginUrl} state={{ from: location }} replace />;
    }

    // 2) Signed in but not ADMIN
    const role = String(user?.role || "").toUpperCase();
    if (role !== "ADMIN") {
        notifyOnce(() =>
            toast.error("Access denied", { description: "This portal is for Admins only." })
        );
        return <Navigate to="/?error=forbidden" state={{ from: location }} replace />;
    }

    // 3) Authorized
    return <Outlet />;
};

export default ProtectedRoute;
