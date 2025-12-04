import React, { useState } from "react";
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
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";

import {
    Filter as FilterIcon,
    RotateCcw,
    Search,
} from "lucide-react";

const orders = [
    { value: "-created_at", label: "Newest" },
    { value: "created_at", label: "Oldest" },
    { value: "email", label: "Email A→Z" },
    { value: "-email", label: "Email Z→A" },
    { value: "username", label: "Username A→Z" },
    { value: "-username", label: "Username Z→A" },
];

const DEFAULTS = {
    search: "",
    status: "all",
    created_after: "",
    created_before: "",
    ordering: "-created_at",
};

const AdminFilters = ({ value, onChange }) => {
    const v = value || DEFAULTS;
    const update = (patch) => onChange?.({ ...v, ...patch });
    const resetFilters = () => onChange?.({ ...DEFAULTS });

    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Trigger button visible on both desktop and mobile */}
            <div className="flex justify-end w-full">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            className="rounded-xl flex items-center gap-2 px-4 py-2"
                        >
                            <FilterIcon className="h-4 w-4" />
                            Filters
                        </Button>
                    </SheetTrigger>

                    {/* FILTER SIDEBAR */}
                    <SheetContent
                        side="left"
                        className="
                            w-full sm:w-[420px]
                            overflow-y-auto p-6
                            bg-white backdrop-blur-xl
                        "
                    >
                        <SheetHeader>
                            <SheetTitle className="text-left">Filter Admins</SheetTitle>
                        </SheetHeader>

                        {/* Filter fields */}
                        <div className="mt-6 grid gap-5">

                            {/* Search */}
                            <div className="grid gap-1">
                                <Label>Search</Label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <Input
                                        placeholder="Search by email, username, phone…"
                                        value={v.search || ""}
                                        onChange={(e) => update({ search: e.target.value })}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="grid gap-1">
                                <Label>Status</Label>
                                <Select
                                    value={v.status || "all"}
                                    onValueChange={(val) => update({ status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Created After */}
                            <div className="grid gap-1">
                                <Label>Created After</Label>
                                <Input
                                    type="datetime-local"
                                    value={v.created_after || ""}
                                    onChange={(e) => update({ created_after: e.target.value })}
                                />
                            </div>

                            {/* Created Before */}
                            <div className="grid gap-1">
                                <Label>Created Before</Label>
                                <Input
                                    type="datetime-local"
                                    value={v.created_before || ""}
                                    onChange={(e) => update({ created_before: e.target.value })}
                                />
                            </div>

                            {/* Ordering */}
                            <div className="grid gap-1">
                                <Label>Sort By</Label>
                                <Select
                                    value={v.ordering || "-created_at"}
                                    onValueChange={(val) => update({ ordering: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sort by…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orders.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Footer buttons */}
                        <SheetFooter className="mt-8">
                            <div className="flex w-full items-center justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={resetFilters}
                                    className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setOpen(false)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="bg-[var(--primary-color)] hover:opacity-90"
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
};

export default AdminFilters;
