import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { auth } from "@/api";

const PWD_RESET_EMAIL_KEY = "pwd_reset_email";
const RESET_INTENT_KEY = "reset_intent";

const ForgetPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState(localStorage.getItem(PWD_RESET_EMAIL_KEY) || "");
    const [emailErr, setEmailErr] = useState("");
    const [loading, setLoading] = useState(false);

    function validate() {
        const val = email.trim();
        if (!val) {
            setEmailErr("Please enter your email address.");
            return false;
        }
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        if (!ok) {
            setEmailErr("Please enter a valid email address.");
            return false;
        }
        setEmailErr("");
        return true;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fix the highlighted field.");
            return;
        }

        try {
            setLoading(true);
            const res = await auth.passwordResetRequest({ email: email.trim() });

            // exact backend message
            toast.success(res?.data?.message || res?.message || "OTP sent to your email.");

            // persist + gate Reset page
            localStorage.setItem(PWD_RESET_EMAIL_KEY, email.trim());
            sessionStorage.setItem(RESET_INTENT_KEY, "1");

            navigate("/reset-password");
        } catch (err) {
            // Build a rich error toast with details (if available)
            const details = Array.isArray(err?.details) ? err.details : [];
            toast.error(
                details.length
                    ? (
                        <div className="space-y-1">
                            <p className="font-medium">{err?.message || "Request failed."}</p>
                            <ul className="list-disc pl-5 text-[12px] leading-relaxed">
                                {details.slice(0, 5).map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                        </div>
                    )
                    : err?.message || "Request failed. Please try again."
            );

            // Inline field error mapping (DRF: {email: ["..."]})
            if (err?.errors?.email) {
                setEmailErr(Array.isArray(err.errors.email) ? err.errors.email[0] : String(err.errors.email));
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full">
            <div className="mb-7">
                <h1 className="text-[32px] leading-none font-bold text-neutral-900">Forget Password</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[13px] text-neutral-700">
                        Enter Email Address
                    </Label>
                    <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailErr("");
                            }}
                            placeholder="inezabella@gmail.com"
                            className="px-10 py-6 rounded-lg border-neutral-300 text-sm placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none hover:border-neutral-400"
                        />
                    </div>
                    {emailErr ? <p className="text-[12px] text-red-500">{emailErr}</p> : null}
                </div>

                {/* Send OTP */}
                <motion.div whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }}>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-6 rounded-4xl glass-cta text-white hover:opacity-95 active:opacity-90 outline-none focus-visible:outline-none cursor-pointer"
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="animate-spin" size={18} /> Sending OTP…
                            </span>
                        ) : (
                            "Send OTP"
                        )}
                    </Button>
                </motion.div>
            </form>
        </div>
    );
};

export default ForgetPassword;
