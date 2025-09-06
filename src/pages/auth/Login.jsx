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
        // If something goes wrong, we still redirect; the portal will bounce to /login
        window.name = "";
    }
    window.location.assign(targetUrl);
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

            const payloadUser = res?.data?.data || null;      // includes clients[]
            const payloadTokens = res?.data?.tokens || null;  // { access, refresh }

            // Persist session locally on auth origin
            saveSession({ tokens: payloadTokens, user: payloadUser });

            // Nicer success: include client name if present
            const clientName = getPrimaryClientName(payloadUser);
            const baseMsg = res?.data?.message || res?.message || "Login successful.";
            toast.success(clientName ? `${baseMsg} Welcome, ${clientName}.` : baseMsg);

            // URL-free SSO handoff to portal
            const target = new URL(urlNext || AFTER_LOGIN_URL);
            handOffViaWindowName({ tokens: payloadTokens, user: payloadUser, targetUrl: target.toString() });
        } catch (err) {
            const details = Array.isArray(err?.details) ? err.details : [];
            toast.error(
                details.length ? (
                    <div className="space-y-1">
                        <p className="font-medium">{err?.message || "Login failed."}</p>
                        <ul className="list-disc pl-5 text-[12px] leading-relaxed">
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

    return (
        <div className="w-full">
            <div className="mb-7">
                <h1 className="text-[32px] leading-none font-bold text-neutral-900">Sign In</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Identifier */}
                <div className="space-y-2">
                    <Label htmlFor="emailOrPhone" className="text-[13px] text-neutral-700">
                        Enter Email Address or Phone Number
                    </Label>
                    <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="emailOrPhone"
                            name="emailOrPhone"
                            value={form.emailOrPhone}
                            onChange={onChange}
                            placeholder="inezabella@gmail.com"
                            className="pl-10 h-[50px] rounded-lg border-neutral-300 text-sm placeholder:text-neutral-400 
               focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none
               hover:border-neutral-400"
                        />
                    </div>
                    {fieldErr.identifier ? (
                        <p className="text-[12px] text-red-500">{fieldErr.identifier}</p>
                    ) : null}
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-[13px] text-neutral-700">
                        Enter Password
                    </Label>
                    <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="password"
                            name="password"
                            type={showPw ? "text" : "password"}
                            value={form.password}
                            onChange={onChange}
                            placeholder="••••••••"
                            className="pl-10 pr-10 h-[50px] rounded-lg border-neutral-300 text-sm placeholder:text-neutral-400
               focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none
               hover:border-neutral-400"
                        />
                        <button
                            type="button"
                            aria-label={showPw ? "Hide password" : "Show password"}
                            onClick={() => setShowPw((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:opacity-80 focus:outline-none"
                        >
                            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {fieldErr.password ? (
                        <p className="text-[12px] text-red-500">{fieldErr.password}</p>
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
                        <Label htmlFor="remember" className="text-[13px] text-neutral-700 cursor-pointer">
                            Remember Me
                        </Label>
                    </div>
                    <Link to="/forget-password" className="text-[13px] text-primary hover:opacity-80">
                        Forget Password?
                    </Link>
                </div>

                {/* Sign In */}
                <motion.div whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }}>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[50px] rounded-lg bg-[var(--primary-color)] text-white 
             hover:opacity-95 active:opacity-90 outline-none focus-visible:outline-none"
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="animate-spin" size={18} /> Signing In…
                            </span>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </motion.div>

                {/* Divider */}
                <div className="relative text-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-200" />
                    </div>
                    <span className="relative bg-white px-4 text-xs text-neutral-500">OR</span>
                </div>

                {/* Google */}
                <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-[50px] rounded-lg border-neutral-300 text-neutral-800 
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
                </motion.div>
            </form>
        </div>
    );
};

export default Login;
