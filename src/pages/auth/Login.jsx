import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { auth, clearTokens } from "@/api";
import { saveSession, clearSession } from "@/session";

const AFTER_LOGIN_URL = "/dashboard";
const FLASH_SUCCESS_KEY = "auth_flash_success";

function getPrimaryClientName(user) {
    if (!user) return "";
    const arr = Array.isArray(user.clients) ? user.clients : [];
    return (arr[0]?.name || "").trim();
}

// Secure, URL-free SSO handoff using window.name
function handOffViaWindowName({ tokens, user, targetUrl }) {
    try {
        const envelope = {
            _type: "BELLA_SSO",
            issued_at: Date.now(),
            tokens, // {access, refresh}
            user,   // includes clients[]
        };
        const encoded = btoa(JSON.stringify(envelope));
        window.name = `BELLA_SSO::${encoded}`;
    } catch {
        window.name = "";
    }
    window.location.assign(targetUrl);
}

// Resolve a safe, absolute same-origin URL for redirects
function resolveTargetUrl(nextParam, fallbackPath = AFTER_LOGIN_URL) {
    try {
        const origin = window.location.origin;

        if (nextParam && typeof nextParam === "string") {
            const candidate = nextParam.trim();
            if (!candidate) return new URL(fallbackPath, origin);

            // Absolute URL provided: allow only same-origin, otherwise fallback
            if (/^https?:\/\//i.test(candidate)) {
                const u = new URL(candidate);
                return u.origin === origin ? u : new URL(fallbackPath, origin);
            }

            // Relative path: ensure leading slash
            const path = candidate.startsWith("/") ? candidate : `/${candidate}`;
            return new URL(path, origin);
        }
    } catch {
        /* noop – fallback below */
    }
    return new URL(fallbackPath, window.location.origin);
}

const Login = () => {
    const location = useLocation();
    const urlNext = new URLSearchParams(location.search).get("next");

    const [form, setForm] = useState({
        emailOrPhone: "",
        password: "",
        remember: false,
    });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fieldErr, setFieldErr] = useState({ identifier: "", password: "" });

    useEffect(() => {
        const msg = sessionStorage.getItem(FLASH_SUCCESS_KEY);
        if (msg) {
            setTimeout(() => toast.success(msg), 10);
            sessionStorage.removeItem(FLASH_SUCCESS_KEY);
        }
    }, []);

    // Best-effort clean slate
    useEffect(() => {
        (async () => {
            try {
                await auth.logoutAll();
            } catch { }
            clearTokens();
            clearSession();
        })();
    }, []);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
        if (name === "emailOrPhone" && fieldErr.identifier) {
            setFieldErr((f) => ({ ...f, identifier: "" }));
        }
        if (name === "password" && fieldErr.password) {
            setFieldErr((f) => ({ ...f, password: "" }));
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.emailOrPhone.trim() || !form.password.trim()) {
            setFieldErr({
                identifier: !form.emailOrPhone.trim() ? "Please enter email/username/phone." : "",
                password: !form.password.trim() ? "Please enter your password." : "",
            });
            toast.error("Please enter your email/phone and password.");
            return;
        }

        try {
            setLoading(true);
            setFieldErr({ identifier: "", password: "" });

            const res = await auth.login({
                identifier: form.emailOrPhone.trim(),
                password: form.password,
            });

            const payloadUser = res?.data?.data || null;      // includes role
            const payloadTokens = res?.data?.tokens || null;  // { access, refresh }

            // Admin-only gate
            const userRole = String(payloadUser?.role || "").toUpperCase();
            if (userRole !== "ADMIN") {
                // do NOT persist tokens/session for non-admin
                toast.error("Access denied", {
                    description: "This portal is for Admins only.",
                });
                return;
            }

            // Persist session (only for admin)
            saveSession({ tokens: payloadTokens, user: payloadUser });

            // Friendly success
            const clientName = getPrimaryClientName(payloadUser);
            const baseMsg = res?.data?.message || res?.message || "Login successful.";
            toast.success(clientName ? `${baseMsg} Welcome, ${clientName}.` : baseMsg);

            // Safe, absolute redirect target
            const target = resolveTargetUrl(urlNext, AFTER_LOGIN_URL);

            // URL-free SSO handoff to portal
            handOffViaWindowName({ tokens: payloadTokens, user: payloadUser, targetUrl: target.toString() });
        } catch (err) {
            const details = Array.isArray(err?.details) ? err.details : [];
            toast.error(
                details.length ? (
                    <div className="space-y-1">
                        <p className="font-medium">{err?.message || "Login failed."}</p>
                        <ul className="list-disc pl-5 text-sm leading-relaxed">
                            {details.slice(0, 3).map((d, i) => (
                                <li key={i}>{d}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    err?.message || "Login failed. Please try again."
                )
            );

            const errors = err?.errors || {};
            const firstDetail =
                typeof err?.data === "object" && typeof err?.data?.detail === "string"
                    ? err.data.detail
                    : "";

            setFieldErr({
                identifier:
                    (Array.isArray(errors.identifier) && errors.identifier[0]) ||
                    errors.identifier ||
                    "",
                password:
                    (Array.isArray(errors.password) && errors.password[0]) ||
                    errors.password ||
                    "",
            });

            if (!errors.identifier && !errors.password && firstDetail) {
                setFieldErr({ identifier: "", password: firstDetail });
            }
        } finally {
            setLoading(false);
        }
    }
    
    // Make ESLint see a concrete JS usage
    const MotionDiv = motion.div;

    return (
        <div className="w-full">
            <div className="mb-7">
                <h1 className="text-[32px] leading-none font-bold text-neutral-900">Sign In</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Identifier */}
                <div className="space-y-2">
                    <Label htmlFor="emailOrPhone" className="text-sm text-neutral-700">
                        Enter Email Address or Phone Number
                    </Label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="emailOrPhone"
                            name="emailOrPhone"
                            value={form.emailOrPhone}
                            onChange={onChange}
                            placeholder="inezabella@gmail.com"
                            className="px-10 py-6 rounded-lg border-neutral-300 text-sm placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none hover:border-neutral-400"
                        />
                    </div>
                    {fieldErr.identifier ? (
                        <p className="text-sm text-red-500">{fieldErr.identifier}</p>
                    ) : null}
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm text-neutral-700">
                        Enter Password
                    </Label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="password"
                            name="password"
                            type={showPw ? "text" : "password"}
                            value={form.password}
                            onChange={onChange}
                            placeholder="••••••••"
                            className="px-10 py-6 rounded-lg border-neutral-300 text-sm placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none hover:border-neutral-400"
                        />
                        <button
                            type="button"
                            aria-label={showPw ? "Hide password" : "Show password"}
                            onClick={() => setShowPw((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:opacity-80 focus:outline-none"
                        >
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {fieldErr.password ? (
                        <p className="text-sm text-red-500">{fieldErr.password}</p>
                    ) : null}
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="remember"
                            checked={form.remember}
                            onCheckedChange={(checked) => setForm((s) => ({ ...s, remember: !!checked }))}
                            className="border-neutral-300 data-[state=checked]:bg-primary data-[state=checked]:text-white"
                        />
                        <Label htmlFor="remember" className="text-sm text-neutral-700 cursor-pointer">
                            Remember Me
                        </Label>
                    </div>
                    <Link to="/forget-password" className="text-sm text-primary hover:opacity-80">
                        Forget Password?
                    </Link>
                </div>

                {/* Sign In */}
                <MotionDiv whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }}>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-6 rounded-4xl glass-cta text-white hover:opacity-95 active:opacity-90 outline-none focus-visible:outline-none cursor-pointer"
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="animate-spin" size={18} /> Signing In…
                            </span>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </MotionDiv>

                {/* <div className="relative text-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-200" />
                    </div>
                    <span className="relative bg-white px-4 text-xs text-neutral-500">OR</span>
                </div>

                <MotionDiv whileTap={{ scale: 0.98 }}>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full px-6 py-6 rounded-4xl glass-button border-neutral-300 text-neutral-800 
             hover:bg-neutral-50 outline-none focus-visible:outline-none"
                        onClick={() => toast.info("Google sign-in coming soon.")}
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt=""
                            className="h-5 w-5 mr-2"
                        />
                        Continue with Google
                    </Button>
                </MotionDiv> */}
            </form>
        </div>
    );
};

export default Login;
