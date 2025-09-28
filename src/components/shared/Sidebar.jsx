import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Boxes,
    Building2,
    ChevronLeft,
    ChevronRight,
    Home,
    LogOut,
    Package,
    Settings,
    Truck,
    User2,
    UserCheck,
    UserCog,
} from "lucide-react";

import { auth } from "@/api";
import { clearSession } from "@/session";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */
function cn(...parts) {
    return parts.filter(Boolean).join(" ");
}

const LS_KEY = "bella_sidebar_collapsed";

/** A tiny composable nav item */
const NavItem = ({ to, icon: Icon, label, collapsed, end = false }) => {
    const base =
        "flex items-center gap-3 rounded-4xl px-3 py-3.5 text-sm transition-colors ring-0";
    const activeGradient =
        "bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 text-white shadow-sm";
    const idle =
        "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white";

    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) => cn(base, isActive ? activeGradient : idle)}
        >
            <Icon className="h-[14px] w-[14px] shrink-0" />
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.18 }}
                        className="whitespace-nowrap"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
        </NavLink>
    );
};

/* ------------------------------------------------------------------ */
/* Sidebar                                                            */
/* ------------------------------------------------------------------ */
const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [open, setOpen] = useState(false); // mobile sheet
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem(LS_KEY) === "1";
        } catch {
            return false;
        }
    });

    const toggleCollapsed = useCallback(() => {
        setCollapsed((c) => {
            const n = !c;
            try {
                localStorage.setItem(LS_KEY, n ? "1" : "0");
            } catch { }
            return n;
        });
    }, []);

    // Open from header (custom event)
    useEffect(() => {
        const handler = () => setOpen(true);
        window.addEventListener("sidebar:open", handler);
        return () => window.removeEventListener("sidebar:open", handler);
    }, []);

    // Keyboard: Ctrl/Cmd + B to toggle collapse (desktop)
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
                e.preventDefault();
                toggleCollapsed();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [toggleCollapsed]);

    const nav = useMemo(
        () => [
            { to: "/dashboard", icon: Home, label: "Dashboard", end: true },
            { to: "/admins", icon: User2, label: "Admins", end: true },
            { to: "/clients", icon: UserCheck, label: "Clients", end: true },
            { to: "/store-members", icon: UserCog, label: "Store Members", end: true },
            { to: "/stores", icon: Building2, label: "Stores" },
            { to: "/products", icon: Package, label: "Products" },
            { to: "/stockin", icon: Boxes, label: "Stock In" },
            { to: "/stockout", icon: Truck, label: "Stock Out" },
        ],
        []
    );

    const logout = useCallback(async () => {
        try {
            await auth.logoutAll();
        } catch {
            // ignore
        } finally {
            clearSession();
            navigate("/?error=logged_out", { replace: true });
        }
    }, [navigate]);

    /* ------------------------------ Desktop ------------------------------ */
    return (
        <>
            {/* Desktop rail (sticky + collapsible). Uses float to avoid changing AppLayout. */}
            <aside
                className={cn(
                    "hidden md:block",
                    "md:float-left md:sticky md:top-2",
                    "md:h-[calc(100vh-1rem)] md:py-2 md:pl-2"
                )}
                aria-label="Primary"
            >
                <motion.div
                    initial={false}
                    animate={{ width: collapsed ? 76 : 264 }}
                    transition={{ type: "spring", damping: 24, stiffness: 260 }}
                    className={cn(
                        "relative h-full rounded-2xl border border-neutral-200/80 bg-white/90 shadow-sm",
                        "backdrop-blur supports-[backdrop-filter]:bg-white/70",
                        "dark:border-neutral-800 dark:bg-neutral-900/70 dark:supports-[backdrop-filter]:bg-neutral-900/50"
                    )}
                    style={{ overflow: "hidden" }}
                >
                    <div className="flex h-full flex-col">
                        <div className="px-3 pt-3">
                            <TooltipProvider delayDuration={150}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={toggleCollapsed}
                                            variant="ghost"
                                            size="icon"
                                            className="ml-auto"
                                            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                                        >
                                            {collapsed ? (
                                                <ChevronRight className="h-4 w-4" />
                                            ) : (
                                                <ChevronLeft className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        {collapsed ? "Expand" : "Collapse"} (⌘/Ctrl + B)
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <Separator className="my-2" />

                        <ScrollArea className="flex-1 px-2">
                            <nav className="space-y-1 pb-4">
                                {nav.map((n) => (
                                    <NavItem
                                        key={n.to}
                                        to={n.to}
                                        icon={n.icon}
                                        label={n.label}
                                        end={n.end}
                                        collapsed={collapsed}
                                    />
                                ))}
                            </nav>

                            <Separator className="my-2" />

                            <div className="space-y-1">
                                <NavLink
                                    to="/settings"
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 rounded-4xl px-3 py-3.5 text-sm transition-colors ring-0",
                                            isActive
                                                ? "bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 text-white shadow-sm"
                                                : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                                        )
                                    }
                                >
                                    <Settings className="h-[14px] w-[14px] shrink-0" />
                                    <AnimatePresence initial={false}>
                                        {!collapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -4 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -6 }}
                                                transition={{ duration: 0.18 }}
                                            >
                                                Settings
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </NavLink>

                                <button
                                    onClick={logout}
                                    className={cn(
                                        "w-full text-left flex items-center gap-3 rounded-4xl px-3 py-3.5 text-sm cursor-pointer",
                                        "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    )}
                                >
                                    <LogOut className="h-[14px] w-[14px] shrink-0" />
                                    <AnimatePresence initial={false}>
                                        {!collapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -4 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -6 }}
                                                transition={{ duration: 0.18 }}
                                            >
                                                Sign Out
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>
                        </ScrollArea>
                    </div>
                </motion.div>
            </aside>

            {/* ------------------------------ Mobile ------------------------------ */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="left"
                    className={cn(
                        "w-[85%] p-0",
                        "bg-white backdrop-blur supports-[backdrop-filter]:bg-white",
                        "dark:bg-neutral-900/70 dark:supports-[backdrop-filter]:bg-neutral-900/50"
                    )}
                >
                    <SheetHeader className="px-4 py-3">
                        <SheetTitle className="text-left">Navigation</SheetTitle>
                    </SheetHeader>
                    <Separator />
                    <div className="h-[calc(100vh-3.25rem)]">
                        <ScrollArea className="h-full px-2 py-3">
                            <nav className="space-y-1">
                                {nav.map((n) => (
                                    <NavLink
                                        key={n.to}
                                        to={n.to}
                                        end={n.end}
                                        onClick={() => setOpen(false)}
                                        className={({ isActive }) =>
                                            cn(
                                                "flex items-center gap-3 rounded-4xl px-4 py-3.5 text-sm transition-colors",
                                                isActive
                                                    ? "bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 text-white shadow-sm"
                                                    : "text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                                            )
                                        }
                                    >
                                        <n.icon className="h-[14px] w-[14px]" />
                                        <span>{n.label}</span>
                                    </NavLink>
                                ))}
                            </nav>

                            <Separator className="my-3" />

                            <div className="grid grid-cols-2 gap-2 px-1">
                                <NavLink
                                    to="/settings"
                                    onClick={() => setOpen(false)}
                                    className={({ isActive }) =>
                                        cn(
                                            "rounded-4xl  px-3 py-3.5 text-sm text-center transition-colors",
                                            isActive
                                                ? "bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 text-white shadow-sm"
                                                : "bg-white/60 text-neutral-700 hover:bg-neutral-100 border border-neutral-200",
                                            "dark:bg-neutral-900/50 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:border-neutral-800"
                                        )
                                    }
                                >
                                    Settings
                                </NavLink>
                                <button
                                    onClick={() => {
                                        setOpen(false);
                                        logout();
                                    }}
                                    className={cn(
                                        "rounded-4xl  px-3 py-3.5 text-sm text-center cursor-pointer",
                                        "bg-white/60 text-red-600 hover:bg-red-50 border border-red-200",
                                        "dark:bg-neutral-900/50 dark:hover:bg-red-900/20 dark:border-red-900/40"
                                    )}
                                >
                                    Sign out
                                </button>
                            </div>
                        </ScrollArea>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
};

export default Sidebar;
