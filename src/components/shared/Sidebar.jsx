import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Store,
    Package,
    Boxes,
    CircleHelp,
    Settings,
    ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const NAV = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    // Safe placeholders that route to dashboard tabs (avoid 404s for now)
    { type: "section", label: "Inventory" },
    { label: "Stores", to: "/dashboard?tab=stores", icon: Store },
    { label: "Products", to: "/dashboard?tab=products", icon: Package },
    { label: "Stock In", to: "/dashboard?tab=stockin", icon: Boxes },
    { type: "section", label: "Support" },
    { label: "Help Center", to: "/dashboard?tab=help", icon: CircleHelp },
    { label: "Settings", to: "/dashboard?tab=settings", icon: Settings },
];

function classNames(...xs) {
    return xs.filter(Boolean).join(" ");
}

const DesktopSidebar = ({ collapsed, onToggle }) => {
    const location = useLocation();

    return (
        <aside
            className={classNames(
                "hidden md:flex h-full border-r bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60",
                collapsed ? "w-[76px]" : "w-[264px]"
            )}
        >
            <div className="flex w-full flex-col">
                {/* Brand small (only visible when collapsed) */}
                <div className="h-14 flex items-center px-3">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 flex items-center justify-center rounded-md bg-primary text-white text-[12px] font-semibold select-none">
                            BA
                        </div>
                        {!collapsed && <span className="text-sm font-semibold text-neutral-900">Bella Admin</span>}
                    </div>
                    <Button
                        onClick={onToggle}
                        variant="ghost"
                        size="icon"
                        className="ml-auto"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        <ChevronLeft
                            className={classNames(
                                "h-4 w-4 transition-transform duration-300",
                                collapsed ? "rotate-180" : "rotate-0"
                            )}
                        />
                    </Button>
                </div>
                <Separator />
                <ScrollArea className="flex-1">
                    <nav className="py-3">
                        {NAV.map((item, idx) =>
                            item.type === "section" ? (
                                <div key={`sec-${idx}`} className={classNames("px-3 pt-5 pb-2", collapsed && "px-2")}>
                                    {!collapsed && (
                                        <div className="text-[11px] tracking-wider uppercase font-semibold text-neutral-500">
                                            {item.label}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        classNames(
                                            "group relative mx-2 my-0.5 flex items-center rounded-md transition-colors",
                                            "hover:bg-neutral-100 focus-visible:outline-none",
                                            isActive ? "bg-neutral-100 text-neutral-900" : "text-neutral-700"
                                        )
                                    }
                                >
                                    {({ isActive }) => (
                                        <motion.div
                                            whileHover={{ x: 2 }}
                                            className={classNames("flex w-full items-center", collapsed ? "px-3 py-2" : "px-3 py-2.5")}
                                        >
                                            <item.icon
                                                className={classNames(
                                                    "h-[18px] w-[18px] flex-shrink-0",
                                                    isActive ? "text-neutral-900" : "text-neutral-500"
                                                )}
                                            />
                                            {!collapsed && (
                                                <span className="ml-3 text-sm font-medium truncate">{item.label}</span>
                                            )}
                                            {isActive && (
                                                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r-md" />
                                            )}
                                        </motion.div>
                                    )}
                                </NavLink>
                            )
                        )}
                    </nav>
                </ScrollArea>
                <Separator />
                {/* Footer mini */}
                <div className={classNames("p-3 text-[11px] text-neutral-500", collapsed && "text-center")}>
                    {!collapsed ? "© " : ""}
                    2025 Bella
                </div>
            </div>
        </aside>
    );
};

const MobileSidebar = ({ onNavigate }) => {
    const location = useLocation();
    useEffect(() => {
        // Close sheet when route changes
        if (onNavigate) onNavigate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, location.search]);

    return (
        <div className="h-full flex flex-col">
            <div className="h-14 px-4 flex items-center">
                <span className="text-sm font-semibold text-neutral-900">Navigation</span>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
                <nav className="py-3">
                    {NAV.map((item, idx) =>
                        item.type === "section" ? (
                            <div key={`msec-${idx}`} className="px-4 pt-5 pb-2">
                                <div className="text-[11px] tracking-wider uppercase font-semibold text-neutral-500">
                                    {item.label}
                                </div>
                            </div>
                        ) : (
                            <NavLink
                                key={`m-${item.to}`}
                                to={item.to}
                                className={({ isActive }) =>
                                    classNames(
                                        "group relative mx-2 my-0.5 flex items-center rounded-md px-3 py-2.5 transition-colors",
                                        "hover:bg-neutral-100",
                                        isActive ? "bg-neutral-100 text-neutral-900" : "text-neutral-700"
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon
                                            className={classNames(
                                                "h-[18px] w-[18px] flex-shrink-0",
                                                isActive ? "text-neutral-900" : "text-neutral-500"
                                            )}
                                        />
                                        <span className="ml-3 text-sm font-medium truncate">{item.label}</span>
                                        {isActive && (
                                            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r-md" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        )
                    )}
                </nav>
            </ScrollArea>
        </div>
    );
};

const Sidebar = ({ variant = "desktop", onNavigate }) => {
    // Persisted collapsed state for desktop
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem("bella_sidebar_collapsed") === "1";
        } catch {
            return false;
        }
    });
    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        try {
            localStorage.setItem("bella_sidebar_collapsed", next ? "1" : "0");
        } catch { }
    };

    if (variant === "mobile") {
        return <MobileSidebar onNavigate={onNavigate} />;
    }
    return <DesktopSidebar collapsed={collapsed} onToggle={toggle} />;
};

export default Sidebar;
