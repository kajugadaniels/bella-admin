import React, { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";

import { RotateCcw } from "lucide-react";

const statuses = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
];

const roles = [
    { value: "all", label: "All roles" },
    { value: "admin", label: "Admins only" },
    { value: "staff", label: "Staff only" },
];

const orderings = [
    { value: "-created_at", label: "Newest" },
    { value: "created_at", label: "Oldest" },
    { value: "store__name", label: "Store name (A–Z)" },
    { value: "-store__name", label: "Store name (Z–A)" },
    { value: "user__email", label: "Email (A–Z)" },
    { value: "-user__email", label: "Email (Z–A)" },
    { value: "user__username", label: "Username (A–Z)" },
    { value: "-user__username", label: "Username (Z–A)" },
];

const DEFAULTS = {
    status: "all",
    role: "all",
    ordering: "-created_at",
};

const StoreMemberFilters = ({ value, onChange, open, onOpenChange }) => {
    const v = value || DEFAULTS;

    // Local draft (apply-only)
    const [draft, setDraft] = useState(v);

    useEffect(() => {
        if (open) setDraft(v);
    }, [open]);

    const update = (patch) =>
        setDraft((prev) => ({ ...prev, ...patch }));

    const reset = () => setDraft(DEFAULTS);

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

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                    {/* STATUS */}
                    <div className="space-y-1">
                        <Label>Status</Label>
                        <Select
                            value={draft.status}
                            onValueChange={(val) => update({ status: val })}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90 backdrop-blur-sm">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ROLE */}
                    <div className="space-y-1">
                        <Label>Role</Label>
                        <Select
                            value={draft.role}
                            onValueChange={(val) => update({ role: val })}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90 backdrop-blur-sm">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ORDERING */}
                    <div className="space-y-1">
                        <Label>Ordering</Label>
                        <Select
                            value={draft.ordering}
                            onValueChange={(val) => update({ ordering: val })}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90 backdrop-blur-sm">
                                <SelectValue placeholder="Sort by…" />
                            </SelectTrigger>
                            <SelectContent>
                                {orderings.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <SheetFooter className="border-t border-neutral-200 px-5 py-4 bg-white">
                    <div className="flex w-full items-center justify-between gap-2">
                        <Button
                            variant="ghost"
                            onClick={reset}
                            className="rounded-4xl px-4 py-5 cursor-pointer text-neutral-700 hover:bg-neutral-100"
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

export default StoreMemberFilters;
