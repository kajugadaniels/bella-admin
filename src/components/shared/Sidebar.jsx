import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { auth } from "@/api";
import { clearSession } from "@/session";

import NavItem from "./NavItem";
import { navLinks, bottomLinks, logoutLink } from "@/lib/navLinks";

function cn(...parts) {
    return parts.filter(Boolean).join(" ");
}

const LS_KEY = "bella_sidebar_collapsed";

const Sidebar = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem(LS_KEY) === "1";
        } catch {
            return false;
        }
    });

    /* Collapse toggle */
    const toggleCollapsed = useCallback(() => {
        setCollapsed((c) => {
            const n = !c;
            try {
                localStorage.setItem(LS_KEY, n ? "1" : "0");
            } catch {
                // ignore API logout errors
            }
            finally {
                clearSession();
                navigate("/?error=logged_out", { replace: true });
            }
            return n;
        });
    }, []);

    /* Custom event: open mobile sidebar */
    useEffect(() => {
        const handler = () => setOpen(true);
        window.addEventListener("sidebar:open", handler);

        return () => window.removeEventListener("sidebar:open", handler);
    }, []);

    /* Keyboard shortcut */
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

    /* Logout */
    const logout = useCallback(async () => {
        try {
            await auth.logoutAll();
        } catch {}
        finally {
            clearSession();
            navigate("/?error=logged_out", { replace: true });
        }
    }, [navigate]);

    const MotionDiv = motion.div;

    /* ─────────────────────────────────────────────────────────── Desktop Sidebar ─ */
    return (
        <>
            <aside
                className={cn(
                    "hidden md:block",
                    "md:float-left md:sticky md:top-2",
                    "md:h-[calc(100vh-1rem)] md:py-2 md:pl-2"
                )}
            >
                <MotionDiv
                    initial={false}
                    animate={{ width: collapsed ? 76 : 264 }}
                    transition={{ type: "spring", damping: 24, stiffness: 260 }}
                    className="relative h-full rounded-2xl border border-neutral-200 bg-white shadow-sm"
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
                            {/* main links */}
                            <nav className="space-y-1 pb-4">
                                {navLinks.map((n) => (
                                    <NavItem
                                        key={n.to}
                                        {...n}
                                        collapsed={collapsed}
                                    />
                                ))}
                            </nav>

                            <Separator className="my-2" />

                            {/* bottom items */}
                            <div className="space-y-1">
                                {bottomLinks.map((n) => (
                                    <NavItem
                                        key={n.to}
                                        {...n}
                                        collapsed={collapsed}
                                    />
                                ))}

                                {/* Logout */}
                                <button
                                    onClick={logout}
                                    className={cn(
                                        "w-full flex items-center gap-3 rounded-4xl px-3 py-3.5 text-sm",
                                        "text-red-600 hover:bg-red-50"
                                    )}
                                >
                                    <logoutLink.icon className="h-[15px] w-[15px]" />

                                    <AnimatePresence initial={false}>
                                        {!collapsed && (
                                            <MotionDiv
                                                initial={{ opacity: 0, x: -4 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -6 }}
                                                transition={{ duration: 0.18 }}
                                            >
                                                {logoutLink.label}
                                            </MotionDiv>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>
                        </ScrollArea>
                    </div>
                </MotionDiv>
            </aside>

            {/* ─────────────────────────────────────────────────────────── Mobile Sidebar ─ */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="left" className="w-[85%] p-0 bg-white">
                    <SheetHeader className="px-4 py-3">
                        <SheetTitle>Navigation</SheetTitle>
                    </SheetHeader>

                    <Separator />

                    <ScrollArea className="h-[calc(100vh-3rem)] px-2 py-3">
                        <nav className="space-y-1">
                            {navLinks.map((n) => (
                                <NavLink
                                    key={n.to}
                                    to={n.to}
                                    end={n.end}
                                    onClick={() => setOpen(false)}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 rounded-4xl px-4 py-3.5 text-sm",
                                            isActive
                                                ? "bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 text-white shadow-sm"
                                                : "text-neutral-800 hover:bg-neutral-100"
                                        )
                                    }
                                >
                                    <n.icon className="h-[15px] w-[15px]" />
                                    <span>{n.label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        <Separator className="my-3" />

                        <div className="grid grid-cols-2 gap-2 px-1">
                            {bottomLinks.map((n) => (
                                <NavLink
                                    key={n.to}
                                    to={n.to}
                                    onClick={() => setOpen(false)}
                                    className="rounded-4xl px-3 py-3.5 text-sm text-center bg-white/60 border border-neutral-200 hover:bg-neutral-100"
                                >
                                    {n.label}
                                </NavLink>
                            ))}

                            <button
                                onClick={() => {
                                    setOpen(false);
                                    logout();
                                }}
                                className="rounded-4xl px-3 py-3.5 text-sm text-center bg-white/60 border border-red-200 text-red-600 hover:bg-red-50"
                            >
                                {logoutLink.label}
                            </button>
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </>
    );
};

export default Sidebar;
