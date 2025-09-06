// src/components/shared/Header.jsx
import React, { useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, ChevronDown, LogOut, Menu, Settings, User2 } from "lucide-react";

import { auth } from "@/api";
import { clearSession, getUser } from "@/session";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */
function cn(...parts) {
    return parts.filter(Boolean).join(" ");
}

function initialsFrom(user) {
    const base = (user?.username || user?.email?.split("@")[0] || user?.email || "User").trim();
    const words = base.replace(/[_\-\.]+/g, " ").split(" ").filter(Boolean);
    const first = (words[0]?.[0] || "U").toUpperCase();
    const second = (words.length > 1 ? words[1][0] : (base[1] || "")).toUpperCase();
    return (first + second).substring(0, 2);
}

function hashToHue(seed = "") {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return h % 360;
}

function gradientFor(user) {
    const key = user?.email || user?.username || "bella";
    const h1 = hashToHue(key);
    const h2 = (h1 + 66) % 360;
    return `linear-gradient(135deg, hsl(${h1} 75% 60%) 0%, hsl(${h2} 75% 55%) 100%)`;
}

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */
const Header = () => {
    const navigate = useNavigate();
    const [opening, setOpening] = useState(false);

    const user = useMemo(() => getUser(), []);
    const role = (user?.role || "").toUpperCase();
    const avatarInitials = useMemo(() => initialsFrom(user), [user]);
    const avatarBg = useMemo(() => gradientFor(user), [user]);

    const handleOpenSidebar = useCallback(() => {
        setOpening(true);
        window.dispatchEvent(new CustomEvent("sidebar:open")); // notify Sidebar to open the mobile drawer
        setTimeout(() => setOpening(false), 280);
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await auth.logoutAll();
        } catch {
            // best-effort; even if API call fails, we clear local session below
        } finally {
            clearSession();
            navigate("/?next=/dashboard", { replace: true });
        }
    }, [navigate]);

    return (
        <motion.header
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={cn(
                "sticky top-0 z-40 w-full",
                "border-b border-neutral-200/80 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70",
                "dark:border-neutral-800 dark:bg-neutral-900/70 dark:supports-[backdrop-filter]:bg-neutral-900/50"
            )}
        >
            <div className="mx-auto">
                <div className="flex h-16 items-center gap-3">
                    {/* Mobile: open sidebar */}
                    <TooltipProvider delayDuration={150}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 md:hidden cursor-pointer"
                                    aria-label="Open menu"
                                    onClick={handleOpenSidebar}
                                >
                                    <Menu className={cn("h-5 w-5", opening && "animate-pulse")} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Menu</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Brand (text only to avoid asset coupling) */}
                    <div
                        className="hidden md:flex items-center gap-2 select-none"
                        role="img"
                        aria-label="Bella Admin"
                    >
                        <div className="h-6 w-6 rounded-lg bg-primary/90" />
                        <span className="text-lg font-semibold tracking-tight text-black">
                            Bella Admin
                        </span>
                    </div>

                    {/* Right actions */}
                    <div className="ml-auto flex items-center gap-1">
                        <TooltipProvider delayDuration={150}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                                        <Bell className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Notifications</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <Separator orientation="vertical" className="mx-2 hidden h-6 md:block" />

                        {/* User menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="pl-1 pr-2">
                                    <div className="relative">
                                        <Avatar className="h-8 w-8 ring-1 ring-black/5 dark:ring-white/10">
                                            {user?.image ? (
                                                <AvatarImage
                                                    src={user.image}
                                                    alt={user?.username || user?.email || "User"}
                                                    className="object-cover"
                                                />
                                            ) : null}
                                            <AvatarFallback
                                                style={{ backgroundImage: avatarBg }}
                                                className="text-white shadow-inner"
                                            >
                                                {avatarInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="ml-2 hidden sm:flex flex-col text-left leading-tight cursor-pointer">
                                        <span className="text-xs font-medium text-neutral-900 dark:text-neutral-50 line-clamp-1 uppercase font-bold">
                                            {user?.username || user?.email?.split("@")[0] || "User"}

                                            {role === "ADMIN" && (
                                                <Badge
                                                    className="ml-1 text-xs border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-900"
                                                    variant="secondary"
                                                >
                                                    ADMIN
                                                </Badge>
                                            )}
                                        </span>
                                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                                            {user?.email || "—"}
                                        </span>
                                    </div>
                                    <ChevronDown className="ml-1 hidden h-4 w-4 text-neutral-400 sm:block" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-64">
                                <DropdownMenuLabel className="space-y-1">
                                    <div className="text-sm font-semibold">
                                        {user?.username || user?.email || "User"}
                                    </div>
                                    <div className="text-xs text-neutral-500">{role || "—"}</div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer">
                                    <User2 className="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="cursor-pointer text-red-600 focus:text-red-700"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;
