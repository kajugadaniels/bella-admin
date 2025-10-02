import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp";

const Verify = () => {

    const slotCls =
        "input-otp-slot h-[50px] w-10 sm:w-12 rounded-lg border border-neutral-300 " +
        "text-[18px] font-medium text-neutral-900 " +
        "outline-none focus:outline-none focus-visible:outline-none " +
        "ring-0 focus:ring-0 focus-visible:ring-0 ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0 " +
        "shadow-none";

    return (
        <div className="w-full">
            <div className="mb-7">
                <h1 className="text-[32px] leading-none font-bold text-neutral-900">Verify Account</h1>
            </div>

            <form className="space-y-5">
                {/* Email (prefilled, still editable) */}
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[13px] text-neutral-700">
                        Email Address
                    </Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="inezabella@gmail.com"
                        className="px-10 py-6 rounded-lg border-neutral-300 text-sm placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none hover:border-neutral-400"
                    />
                </div>

                {/* 7-digit OTP */}
                <div className="space-y-2">
                    <Label className="text-[13px] text-neutral-700">Verification Code</Label>
                    <div className="flex justify-center">
                        <InputOTP className="mx-auto">
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

                {/* Timer + Resend */}
                <div className="flex items-center justify-between text-sm">
                    <button
                        type="button"
                        className="text-primary hover:opacity-80"
                    >
                        Resend Code
                    </button>
                </div>

                {/* Verify */}
                <motion.div whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }}>
                    <Button
                        type="submit"
                        className="w-full px-6 py-6 rounded-4xl glass-cta text-white hover:opacity-95 active:opacity-90 outline-none focus-visible:outline-none cursor-pointer"
                    >
                        Verify Account
                    </Button>
                </motion.div>
            </form>
        </div>
    )
}

export default Verify
