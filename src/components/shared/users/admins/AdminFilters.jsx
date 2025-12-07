import React, { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";

import { RotateCcw } from "lucide-react";

const orders = [
    { value: "-created_at", label: "Newest" },
    { value: "created_at", label: "Oldest" },
    { value: "email", label: "Email A→Z" },
    { value: "-email", label: "Email Z→A" },
    { value: "username", label: "Username A→Z" },
    { value: "-username", label: "Username Z→A" },
];

const DEFAULTS = {
    status: "all",
    created_after: "",
    created_before: "",
    ordering: "-created_at",
};

const AdminFilters = ({ value, onChange, open, onOpenChange }) => {
    const v = value || DEFAULTS;

    // Local state that holds user input until Apply
    const [draft, setDraft] = useState(v);

    // Sync draft when parent opens sheet
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
                <SheetHeader className="px-5 py-4 border-b border-neutral-200">
                    <SheetTitle className="text-left">Filters</SheetTitle>
                </SheetHeader>

                {/* Scrollable fields */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                    {/* STATUS */}
                    <div className="space-y-1">
                        <Label>Status</Label>
                        <Select
                            value={draft.status}
                            onValueChange={(val) => update({ status: val })}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90 backdrop-blur-sm">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-md">
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* CREATED AFTER */}
                    <div className="space-y-1">
                        <Label>Created after</Label>
                        <Input
                            type="datetime-local"
                            value={draft.created_after || ""}
                            onChange={(e) => update({ created_after: e.target.value })}
                            className="border-neutral-300 bg-white/90 backdrop-blur-sm"
                        />
                    </div>

                    {/* CREATED BEFORE */}
                    <div className="space-y-1">
                        <Label>Created before</Label>
                        <Input
                            type="datetime-local"
                            value={draft.created_before || ""}
                            onChange={(e) => update({ created_before: e.target.value })}
                            className="border-neutral-300 bg-white/90 backdrop-blur-sm"
                        />
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
                            <SelectContent className="bg-white/95 backdrop-blur-md">
                                {orders.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* FOOTER */}
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

export default AdminFilters;
