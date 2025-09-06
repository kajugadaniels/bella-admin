import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { auth } from "@/api";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp";

const OTP_LENGTH = 7;
const PWD_RESET_EMAIL_KEY = "pwd_reset_email";
const RESET_INTENT_KEY = "reset_intent";
const FLASH_SUCCESS_KEY = "auth_flash_success";
const LOGIN_URL = import.meta.env.VITE_SERVICE_AUTH_ORIGIN || "/";

const ResetPassword = () => {
    const navigate = useNavigate();

    // gate
    const [gateChecked, setGateChecked] = useState(false);

    // data
    const [email, setEmail] = useState("");
    const [emailErr, setEmailErr] = useState("");
    const [code, setCode] = useState("");

    // password fields
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const otpRef = useRef(null);

    // 🔒 Route protection: must come from Forgot + have stored email
    useEffect(() => {
        const storedEmail = localStorage.getItem(PWD_RESET_EMAIL_KEY);
        const cameFromForgot = sessionStorage.getItem(RESET_INTENT_KEY) === "1";

        if (!storedEmail || !cameFromForgot) {
            toast.error("Please request a password reset first.");
            setTimeout(() => navigate("/forget-password", { replace: true }), 30);
            return;
        }

        setEmail(storedEmail);
        setGateChecked(true);
    }, [navigate]);

    // helpers: password rules
    const rules = useMemo(() => {
        const upper = /[A-Z]/.test(password);
        const lower = /[a-z]/.test(password);
        const digit = /\d/.test(password);
        const symbol = /[^A-Za-z0-9]/.test(password);
        const len = password.length >= 8;
        return { upper, lower, digit, symbol, len };
    }, [password]);

    const allGood = Object.values(rules).every(Boolean);

    // validations
    function validate() {
        if (!email.trim()) {
            setEmailErr("Email is required.");
            return false;
        }
        setEmailErr("");

        if (code.length !== OTP_LENGTH) {
            toast.error(`Enter the ${OTP_LENGTH}-digit code sent to your email.`);
            otpRef.current?.querySelector("input")?.focus();
            return false;
        }
        if (!allGood) {
            toast.error("Password does not meet the required policy.");
            return false;
        }
        if (!confirm) {
            toast.error("Please confirm your new password.");
            return false;
        }
        if (password !== confirm) {
            toast.error("Passwords do not match.");
            return false;
        }
        return true;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            const res = await auth.passwordResetConfirm({
                email: email.trim(),
                otp: code,
                new_password: password,
                confirm_new_password: confirm,
            });

            // exact backend message + flash for Login
            const successMsg =
                res?.data?.message ||
                res?.message ||
                "Password reset successful. You can now log in.";
            toast.success(successMsg);
            sessionStorage.setItem(FLASH_SUCCESS_KEY, successMsg);

            // cleanup the gate
            sessionStorage.removeItem(RESET_INTENT_KEY);
            localStorage.removeItem(PWD_RESET_EMAIL_KEY);

            // go to Login (auth micro-frontend)
            window.location.assign(LOGIN_URL);
        } catch (err) {
            const details = Array.isArray(err?.details) ? err.details : [];
            toast.error(
                details.length
                    ? (
                        <div className="space-y-1">
                            <p className="font-medium">{err?.message || "Password reset failed."}</p>
                            <ul className="list-disc pl-5 text-[12px] leading-relaxed">
                                {details.slice(0, 5).map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                        </div>
                    )
                    : err?.message || "Password reset failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    // OTP slot class (no outline/ring/hover borders)
    const slotCls =
        "input-otp-slot h-[50px] w-10 sm:w-12 rounded-lg border border-neutral-300 " +
        "text-[18px] font-medium text-neutral-900 " +
        "outline-none focus:outline-none focus-visible:outline-none " +
        "ring-0 focus:ring-0 focus-visible:ring-0 ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0 " +
        "shadow-none";

    if (!gateChecked) return null;

    return (
        <div className="w-full">
            <div className="mb-7">
                <h1 className="text-[32px] leading-none font-bold text-neutral-900">Reset Password</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email (prefilled; editable if needed) */}
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[13px] text-neutral-700">
                        Email Address
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailErr("");
                            localStorage.setItem(PWD_RESET_EMAIL_KEY, e.target.value);
                        }}
                        placeholder="inezabella@gmail.com"
                        className="h-[50px] rounded-lg border-neutral-300 text-[14px] placeholder:text-neutral-400 
                       focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none
                       hover:border-neutral-400"
                    />
                    {emailErr ? <p className="text-[12px] text-red-500">{emailErr}</p> : null}
                    {email && (
                        <p className="text-[12px] text-neutral-500">
                            Enter the 7-digit code we sent to <span className="font-medium">{email}</span>.
                        </p>
                    )}
                </div>

                {/* 7-digit OTP */}
                <div className="space-y-2">
                    <Label className="text-[13px] text-neutral-700">Verification Code</Label>
                    <div ref={otpRef} className="flex justify-center">
                        <InputOTP autoFocus maxLength={OTP_LENGTH} value={code} onChange={setCode} className="mx-auto">
                            <InputOTPGroup className="gap-2">
                                <InputOTPSlot index={0} className={slotCls} />
                                <InputOTPSlot index={1} className={slotCls} />
                                <InputOTPSlot index={2} className={slotCls} />
                            </InputOTPGroup>

                            <InputOTPSeparator className="w-6" />

                            <InputOTPGroup className="gap-2">
                                <InputOTPSlot index={3} className={slotCls} />
                                <InputOTPSlot index={4} className={slotCls} />
                                <InputOTPSlot index={5} className={slotCls} />
                            </InputOTPGroup>

                            <InputOTPSeparator className="w-6" />

                            <InputOTPGroup className="gap-2">
                                <InputOTPSlot index={6} className={slotCls} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-[13px] text-neutral-700">
                        New Password
                    </Label>
                    <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="password"
                            name="password"
                            type={showPw ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="px-10 py-6 rounded-lg border-neutral-300 text-[14px]
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

                    {/* Policy checklist */}
                    <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
                        <li className={rules.upper ? "text-green-600" : "text-neutral-500"}>At least one uppercase letter</li>
                        <li className={rules.lower ? "text-green-600" : "text-neutral-500"}>At least one lowercase letter</li>
                        <li className={rules.digit ? "text-green-600" : "text-neutral-500"}>At least one number</li>
                        <li className={rules.symbol ? "text-green-600" : "text-neutral-500"}>At least one symbol</li>
                        <li className={rules.len ? "text-green-600" : "text-neutral-500"}>Minimum 8 characters</li>
                    </ul>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <Label htmlFor="confirm" className="text-[13px] text-neutral-700">
                        Confirm Password
                    </Label>
                    <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="confirm"
                            name="confirm"
                            type={showConfirm ? "text" : "password"}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="••••••••"
                            className="px-10 py-6 rounded-lg border-neutral-300 text-[14px]
                         focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none
                         hover:border-neutral-400"
                        />
                        <button
                            type="button"
                            aria-label={showConfirm ? "Hide password" : "Show password"}
                            onClick={() => setShowConfirm((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:opacity-80 focus:outline-none"
                        >
                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {confirm && password !== confirm ? (
                        <p className="text-[12px] text-red-500">Passwords do not match.</p>
                    ) : null}
                </div>

                {/* Reset Password */}
                <motion.div whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }}>
                    <Button
                        type="submit"
                        disabled={loading}
                        onClick={handleSubmit}
                        className="w-full px-6 py-6 rounded-4xl glass-cta text-white 
                       hover:opacity-95 active:opacity-90 outline-none focus-visible:outline-none"
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="animate-spin" size={18} /> Resetting…
                            </span>
                        ) : (
                            "Reset Password"
                        )}
                    </Button>
                </motion.div>
            </form>
        </div>
    );
};

export default ResetPassword;
