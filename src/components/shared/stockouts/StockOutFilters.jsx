import React, { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";

import { RotateCcw } from "lucide-react";

const DEFAULT_ORDERING = "-created_at";
const DEFAULT_REASON = "ALL";
const DEFAULT_VOID = "ALL";

const reasons = [
    { value: "ALL", label: "All" },
    { value: "SALE", label: "Sale" },
    { value: "ADJUSTMENT", label: "Adjustment" },
    { value: "DAMAGE", label: "Damage / Waste" },
    { value: "TRANSFER_OUT", label: "Transfer out" },
];

const voidStates = [
    { value: "ALL", label: "Any" },
    { value: "false", label: "Active only" },
    { value: "true", label: "Voided only" },
];

const orderings = [
    { value: "-created_at", label: "Newest" },
    { value: "created_at", label: "Oldest" },
    { value: "-quantity", label: "Qty (high→low)" },
    { value: "quantity", label: "Qty (low→high)" },
];

const DEFAULTS = {
    reason: DEFAULT_REASON,
    isVoid: DEFAULT_VOID,
    ordering: DEFAULT_ORDERING,
};

const StockOutFilters = ({ value, onChange, open, onOpenChange }) => {
    const v = value || DEFAULTS;

    // Local draft state (only applied on Apply)
    const [draft, setDraft] = useState(v);

    useEffect(() => {
        if (open) setDraft(v);
    }, [open, v]);

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
                {/* Header */}
                <SheetHeader className="px-5 py-4 border-b border-neutral-200">
                    <SheetTitle className="text-left">Filters</SheetTitle>
                </SheetHeader>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                    {/* Reason */}
                    <div className="space-y-1">
                        <Label>Reason</Label>
                        <Select
                            value={draft.reason}
                            onValueChange={(val) => update({ reason: val })}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90 backdrop-blur-sm">
                                <SelectValue placeholder="Reason" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-md">
                                {reasons.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Voided */}
                    <div className="space-y-1">
                        <Label>Voided</Label>
                        <Select
                            value={draft.isVoid}
                            onValueChange={(val) => update({ isVoid: val })}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90 backdrop-blur-sm">
                                <SelectValue placeholder="Voided" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-md">
                                {voidStates.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
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
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-md">
                                {orderings.map((o) => (
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
                            className="text-neutral-700 hover:bg-neutral-100 rounded-4xl px-4 py-5"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => onOpenChange(false)}
                                className="rounded-4xl px-4 py-5"
                            >
                                Close
                            </Button>

                            <Button
                                onClick={applyFilters}
                                className="glass-cta rounded-4xl px-4 py-5"
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

export default StockOutFilters;
