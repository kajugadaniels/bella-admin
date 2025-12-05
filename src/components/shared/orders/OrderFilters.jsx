import React, { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";

import { RotateCcw } from "lucide-react";

const ANY = "__any__";

const statusOptions = [
    { value: ANY, label: "Any status" },
    { value: "DRAFT", label: "Draft" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PAID", label: "Paid" },
    { value: "FULFILLED", label: "Fulfilled" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "REFUNDED", label: "Refunded" },
];

const pStatusOptions = [
    { value: ANY, label: "Any payment" },
    { value: "PENDING", label: "Payment Pending" },
    { value: "PAID", label: "Payment Paid" },
    { value: "FAILED", label: "Payment Failed" },
    { value: "REFUNDED", label: "Payment Refunded" },
];

const pMethodOptions = [
    { value: ANY, label: "Any method" },
    { value: "CASH", label: "Cash" },
    { value: "MOMO", label: "Mobile Money" },
    { value: "CARD", label: "Card" },
    { value: "OTHER", label: "Other" },
];

const orderingOptions = [
    { value: "-created_at", label: "Newest" },
    { value: "created_at", label: "Oldest" },
    { value: "grand_total", label: "Total (low→high)" },
    { value: "-grand_total", label: "Total (high→low)" },
    { value: "status", label: "Status (A–Z)" },
    { value: "-status", label: "Status (Z–A)" },
];

const DEFAULTS = {
    status: ANY,
    paymentStatus: ANY,
    paymentMethod: ANY,
    ordering: "-created_at",
};

const OrderFilters = ({ value, onChange, open, onOpenChange }) => {
    const v = value || DEFAULTS;

    const [draft, setDraft] = useState(v);

    useEffect(() => {
        if (open) setDraft(v);
    }, [open]);

    const update = (patch) => setDraft((prev) => ({ ...prev, ...patch }));
    const resetFilters = () => setDraft(DEFAULTS);

    const applyFilters = () => {
        onChange?.(draft);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[90%] sm:w-[380px] p-0 flex flex-col bg-white"
            >
                <SheetHeader className="px-5 py-4 border-b border-neutral-200">
                    <SheetTitle className="text-left">Filters</SheetTitle>
                </SheetHeader>

                {/* scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                    {/* Order Status */}
                    <div className="space-y-1">
                        <Label>Order status</Label>
                        <Select
                            value={draft.status}
                            onValueChange={(val) => update({ status: val })}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90 backdrop-blur-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-md">
                                {statusOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payment Status */}
                    <div className="space-y-1">
                        <Label>Payment status</Label>
                        <Select
                            value={draft.paymentStatus}
                            onValueChange={(val) => update({ paymentStatus: val })}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90 backdrop-blur-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-md">
                                {pStatusOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1">
                        <Label>Payment method</Label>
                        <Select
                            value={draft.paymentMethod}
                            onValueChange={(val) => update({ paymentMethod: val })}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90 backdrop-blur-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-md">
                                {pMethodOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ordering */}
                    <div className="space-y-1">
                        <Label>Ordering</Label>
                        <Select
                            value={draft.ordering}
                            onValueChange={(val) => update({ ordering: val })}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90 backdrop-blur-sm">
                                <SelectValue placeholder="Sort by…" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-md">
                                {orderingOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Footer */}
                <SheetFooter className="border-t border-neutral-200 px-5 py-4 bg-white">
                    <div className="flex w-full items-center justify-between gap-2">
                        <Button
                            variant="ghost"
                            onClick={resetFilters}
                            className="text-neutral-700 hover:bg-neutral-100 rounded-4xl px-4 py-5 cursor-pointer"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => onOpenChange(false)}
                                className="rounded-4xl px-4 py-5 cursor-pointer"
                            >
                                Close
                            </Button>

                            <Button
                                onClick={applyFilters}
                                className="glass-cta rounded-4xl px-4 py-5 cursor-pointer"
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default OrderFilters;
