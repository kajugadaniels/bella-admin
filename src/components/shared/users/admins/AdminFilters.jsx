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
import { Separator } from "@/components/ui/separator";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
    Filter as FilterIcon,
    Search,
    RotateCcw,
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

    // mobile sheet
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Desktop / Tablet: one-line toolbar */}
            <div
                className="
          hidden md:flex items-end gap-3
          rounded-2xl border border-neutral-200 bg-white/70 p-3 backdrop-blur-sm
          dark:border-neutral-800 dark:bg-neutral-900/60
        "
            >
                {/* Search */}
                <div className="flex basis-[40%] grow flex-col gap-1">
                    <Label className="text-[12px]">Search</Label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search by email, username, phone…"
                            value={v.search || ""}
                            onChange={(e) => update({ search: e.target.value })}
                            className="pl-9 border-neutral-300 bg-white/90 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/70"
                        />
                    </div>
                </div>

                {/* Status */}
                <div className="min-w-[180px]">
                    <Label className="text-[12px]">Status</Label>
                    <Select
                        value={v.status || "all"}
                        onValueChange={(val) => update({ status: val })}
                    >
                        <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Created after (commented like StoreFilters desktop) */}
                {/* <div className="min-w-[210px]">
          <Label className="text-[12px]">Created after</Label>
          <Input
            type="datetime-local"
            value={v.created_after || ""}
            onChange={(e) => update({ created_after: e.target.value })}
            className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800"
          />
        </div> */}

                {/* Created before (commented like StoreFilters desktop) */}
                {/* <div className="min-w-[210px]">
          <Label className="text-[12px]">Created before</Label>
          <Input
            type="datetime-local"
            value={v.created_before || ""}
            onChange={(e) => update({ created_before: e.target.value })}
            className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800"
          />
        </div> */}

                {/* Ordering */}
                <div className="min-w-[180px]">
                    <Label className="text-[12px]">Ordering</Label>
                    <Select
                        value={v.ordering || "-created_at"}
                        onValueChange={(val) => update({ ordering: val })}
                    >
                        <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
                            <SelectValue placeholder="Sort by…" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
                            {orders.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Reset (desktop) */}
                <div className="min-w-[120px] flex items-end">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={resetFilters}
                        className="cursor-pointer text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                </div>
            </div>

            {/* Mobile: compact search + filters trigger */}
            <div className="md:hidden space-y-2">
                <div className="rounded-2xl border border-neutral-200 bg-white/70 p-3 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/60">
                    <Label className="text-[12px]">Search</Label>
                    <div className="relative mt-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search by email, username, phone…"
                            value={v.search || ""}
                            onChange={(e) => update({ search: e.target.value })}
                            className="pl-9 border-neutral-300 bg-white/90 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/70"
                        />
                    </div>
                </div>

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <button
                            className="
                w-full rounded-xl border border-neutral-300 bg-white/90 px-3 py-2 text-left text-sm text-neutral-700 backdrop-blur-sm
                dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-200
                flex items-center gap-2
              "
                        >
                            <FilterIcon className="h-4 w-4 opacity-70" />
                            Open filters
                        </button>
                    </SheetTrigger>
                    <SheetContent
                        side="bottom"
                        className="
              h-[85vh] overflow-y-auto
              bg-white/90 backdrop-blur-xl border-t border-neutral-200
              dark:bg-neutral-900/90 dark:border-neutral-800
            "
                    >
                        <SheetHeader>
                            <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>

                        <div className="mt-4 grid gap-4">
                            <div className="grid gap-1">
                                <Label>Status</Label>
                                <Select
                                    value={v.status || "all"}
                                    onValueChange={(val) => update({ status: val })}
                                >
                                    <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-1">
                                <Label>Created after</Label>
                                <Input
                                    type="datetime-local"
                                    value={v.created_after || ""}
                                    onChange={(e) => update({ created_after: e.target.value })}
                                    className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800"
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label>Created before</Label>
                                <Input
                                    type="datetime-local"
                                    value={v.created_before || ""}
                                    onChange={(e) => update({ created_before: e.target.value })}
                                    className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800"
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label>Ordering</Label>
                                <Select
                                    value={v.ordering || "-created_at"}
                                    onValueChange={(val) => update({ ordering: val })}
                                >
                                    <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
                                        <SelectValue placeholder="Sort by…" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
                                        {orders.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <SheetFooter className="mt-6">
                            <div className="flex w-full items-center justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={resetFilters}
                                    className="cursor-pointer text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setOpen(false)}
                                        className="cursor-pointer"
                                    >
                                        Close
                                    </Button>
                                    <Button type="button" onClick={() => setOpen(false)} className="cursor-pointer">
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
