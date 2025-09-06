import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Menu,
    Bell,
    ChevronDown,
    LogOut,
    User2,
    Settings as SettingsIcon,
    Search as SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getUser, clearSession } from "@/session";
import { auth } from "@/api";
import Sidebar from "./Sidebar";

const gradients = [
    "from-emerald-500 to-teal-600",
    "from-sky-500 to-indigo-600",
    "from-fuchsia-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
    "from-rose-500 to-red-600",
    "from-lime-500 to-green-600",
];

function hashIdx(str) {
    let h = 0;
    for (let i = 0; i < (str || "").length; i++) h = (h << 5) - h + str.charCodeAt(i);
    return Math.abs(h);
}
function getInitials(user) {
    const base = (user?.username || user?.email || "").trim();
    if (!base) return "U";
    const clean = base.replace(/[_\-\.]/g, " ");
    const parts = clean.split(" ").filter(Boolean);
    if (parts.length === 1) {
        const single = parts[0];
        if (single.includes("@")) return single[0]?.toUpperCase();
        return single.slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Header = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const user = useMemo(() => getUser(), []);
    const displayName = useMemo(() => {
        if (!user) return "User";
        return user.username || user.email?.split("@")[0] || "User";
    }, [user]);

    const avatarGradient = useMemo(() => {
        const key = user?.email || user?.username || user?.id || "x";
        return gradients[hashIdx(key) % gradients.length];
    }, [user]);

    async function handleLogout() {
        try {
            // Try server logout; fall back to local clear on any error
            await auth.logoutAll();
            toast.success("You have been signed out.");
        } catch (e) {
            // Preserve backend message if present
            toast.error(e?.message || "Signed out locally.");
        } finally {
            clearSession();
            navigate("/?logged_out=1", { replace: true });
        }
    }

    return (
        <motion.header
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
                {/* Mobile: open sidebar */}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[300px]">
                        <SheetHeader className="p-4 pb-2">
                            <SheetTitle className="text-lg">Bella Admin</SheetTitle>
                        </SheetHeader>
                        <Separator />
                        <Sidebar variant="mobile" onNavigate={() => setOpen(false)} />
                        <div className="p-4">
                            <SheetClose asChild>
                                <Button className="w-full" variant="secondary">Close</Button>
                            </SheetClose>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Brand / Title */}
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white text-[12px] font-semibold select-none">
                        BA
                    </div>
                    <span className="hidden md:inline text-base font-semibold text-neutral-900">
                        Bella Admin
                    </span>
                </div>

                {/* Search */}
                <div className="flex-1 min-w-0">
                    <div className="relative hidden sm:block">
                        <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            type="text"
                            placeholder="Search…"
                            className="pl-9 h-9 rounded-md border-neutral-300 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notifications</span>
                    </Button>

                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="px-2">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 ring-2 ring-white/70">
                                        {user?.image ? (
                                            <AvatarImage src={user.image} alt={displayName} />
                                        ) : null}
                                        <AvatarFallback
                                            className={`text-white text-[12px] font-semibold bg-gradient-to-br ${avatarGradient}`}
                                        >
                                            {getInitials(user)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:flex flex-col items-start leading-tight">
                                        <span className="text-sm font-medium text-neutral-900">
                                            {displayName}
                                        </span>
                                        <span className="text-[11px] text-neutral-500">
                                            {(user?.role || "ADMIN").toString().toUpperCase()}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-neutral-500 hidden md:block" />
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                                <User2 className="h-4 w-4 mr-2" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <SettingsIcon className="h-4 w-4 mr-2" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;
