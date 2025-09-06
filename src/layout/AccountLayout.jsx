import React, { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

// assets
import { Img1, Img2, Img3, Img4, Img5, LogoColor, LogoWhite } from "@/assets";

const RIGHT_SIDE_META = {
    "/": {
        image: Img5,
        title: "Bella",
        tagline: "The easiest way to manage your groceries.",
    },
    "/forget-password": {
        image: Img2,
        title: "Forgot your password?",
        tagline: "We’ll help you recover access in a moment.",
    },
    "/reset-password": {
        image: Img1,
        title: "Reset password",
        tagline: "Choose a strong password to secure your account.",
    },
};

const AccountLayout = () => {
    const { pathname } = useLocation();
    const meta = useMemo(() => RIGHT_SIDE_META[pathname] || RIGHT_SIDE_META["/"], [pathname]);

    // Read footer destinations from environment (with sensible fallbacks)
    const ABOUT_URL =
        import.meta.env.VITE_ABOUT_URL

    const TERMS_URL =
        import.meta.env.VITE_TERMS_URL

    const PRIVACY_URL =
        import.meta.env.VITE_PRIVACY_URL

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 h-screen bg-white">
            {/* LEFT: header / scrollable content / fixed footer */}
            <div className="grid grid-rows-[auto_minmax(0,1fr)_auto] h-screen">
                {/* Header (logo) */}
                <div className="px-6 sm:px-10 pt-6">
                    <div className="flex items-center gap-3">
                        <img src={LogoColor} alt="Bella" className="h-8 w-auto" />
                        <span className="text-2xl font-semibold text-primary">Bella</span>
                    </div>
                </div>

                {/* Scrollable center (form area), scrollbars hidden */}
                <div className="px-6 sm:px-10 no-scrollbar overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="w-full max-w-[560px] mx-auto flex items-center justify-center"
                        style={{ minHeight: "calc(100vh - 160px)" }}
                    >
                        <Outlet />
                    </motion.div>
                </div>

                {/* Fixed footer (centered, unmoveable) */}
                <div className="px-6 sm:px-10 pb-6">
                    <div className="w-full max-w-[560px] mx-auto">
                        <nav
                            aria-label="Legal"
                            className="flex items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-500"
                        >
                            <a
                                className="hover:opacity-80 transition-opacity"
                                href={ABOUT_URL}
                                rel="noopener"
                                target="_blank"
                            >
                                About Us
                            </a>
                            <a
                                className="hover:opacity-80 transition-opacity"
                                href={TERMS_URL}
                                rel="noopener"
                                target="_blank"
                            >
                                Terms of Service
                            </a>
                            <a
                                className="hover:opacity-80 transition-opacity"
                                href={PRIVACY_URL}
                                rel="noopener"
                                target="_blank"
                            >
                                Privacy Policy
                            </a>
                        </nav>
                    </div>
                </div>
            </div>

            {/* RIGHT: image, full height, non-scrollable */}
            <div className="relative hidden md:block h-screen overflow-hidden">
                <img
                    src={meta.image}
                    alt="Bella visual"
                    className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
                />
                <div className="absolute inset-0 bg-black/45" />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="relative z-10 h-full w-full flex items-center justify-center p-8"
                >
                    <div className="text-center text-white max-w-[520px]">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <img src={LogoWhite} alt="Bella logo" className="h-9 w-auto opacity-95" />
                            <span className="text-3xl font-semibold">Bella</span>
                        </div>
                        <p className="text-lg leading-7 opacity-95">{meta.tagline}</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AccountLayout;
