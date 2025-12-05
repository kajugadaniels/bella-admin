import React, { useEffect, useMemo, useState } from "react";
import * as RW from "rwanda";

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

import { Check, ChevronsUpDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

/* ----------------------------- helpers ----------------------------- */
const uniqSort = (arr) =>
    Array.from(new Set((arr || []).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b))
    );

const safeProvinces = () => {
    try {
        return uniqSort(RW.Provinces?.() || []);
    } catch {
        return [];
    }
};
const safeDistricts = (pv) => {
    if (!pv) return [];
    try {
        return uniqSort(RW.Districts?.(pv) || []);
    } catch {
        return [];
    }
};
const safeSectors = (pv, dt) => {
    if (!pv || !dt) return [];
    try {
        return uniqSort(RW.Sectors?.(pv, dt) || []);
    } catch {
        return [];
    }
};

/* -------------------- reusable searchable combobox -------------------- */
const SearchableCombobox = ({ value, onChange, options = [], placeholder }) => {
    const [open, setOpen] = useState(false);
    const selected = value || "";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-white/90 border-neutral-300"
                >
                    <span className={cn(!selected && "text-neutral-400")}>
                        {selected || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0 w-[--radix-popover-trigger-width] bg-white/95 border border-neutral-200">
                <Command>
                    <CommandInput placeholder="Search…" />
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandList className="max-h-64 overflow-y-auto">
                        <CommandGroup>
                            {options.map((opt) => {
                                const isActive = opt === selected;
                                return (
                                    <CommandItem
                                        key={opt}
                                        value={opt}
                                        onSelect={() => {
                                            onChange(opt);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                isActive ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {opt}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

/* ----------------------------- defaults ----------------------------- */
const DEFAULTS = {
    has_admin: "",
    province: "",
    district: "",
    sector: "",
    created_after: "",
    created_before: "",
    ordering: "-created_at",
};

/* ----------------------------- ordering ----------------------------- */
const orders = [
    { value: "-created_at", label: "Newest" },
    { value: "created_at", label: "Oldest" },
    { value: "name", label: "Name A→Z" },
    { value: "-name", label: "Name Z→A" },
    { value: "-staff_count", label: "Most staff" },
    { value: "staff_count", label: "Fewest staff" },
    { value: "district", label: "District A→Z" },
    { value: "-district", label: "District Z→A" },
];

/* ----------------------------- component ----------------------------- */
const StoreFilters = ({ value, onChange, open, onOpenChange }) => {
    const v = value || DEFAULTS;

    // Draft state: applies only when user clicks APPLY
    const [draft, setDraft] = useState(v);

    useEffect(() => {
        if (open) setDraft(v); // sync when opening
    }, [open]);

    const update = (patch) =>
        setDraft((p) => ({
            ...p,
            ...patch,
        }));

    const reset = () => setDraft(DEFAULTS);

    const apply = () => {
        onChange?.(draft);
        onOpenChange(false);
    };

    // Rwanda lists
    const provinces = useMemo(() => safeProvinces(), []);
    const districts = useMemo(() => safeDistricts(draft.province), [draft.province]);
    const sectors = useMemo(
        () => safeSectors(draft.province, draft.district),
        [draft.province, draft.district]
    );

    const hasAdminValue =
        draft.has_admin === true ? "true" : draft.has_admin === false ? "false" : "all";

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
                    {/* Province */}
                    <div className="space-y-1">
                        <Label>Province</Label>
                        <SearchableCombobox
                            value={draft.province}
                            onChange={(val) =>
                                update({ province: val, district: "", sector: "" })
                            }
                            options={provinces}
                            placeholder="Select province"
                        />
                    </div>

                    {/* District */}
                    <div className="space-y-1">
                        <Label>District</Label>
                        <SearchableCombobox
                            value={draft.district}
                            onChange={(val) => update({ district: val, sector: "" })}
                            options={districts}
                            placeholder="Select district"
                            disabled={!draft.province}
                        />
                    </div>

                    {/* Sector */}
                    <div className="space-y-1">
                        <Label>Sector</Label>
                        <SearchableCombobox
                            value={draft.sector}
                            onChange={(val) => update({ sector: val })}
                            options={sectors}
                            placeholder="Select sector"
                            disabled={!draft.province || !draft.district}
                        />
                    </div>

                    {/* Has Admin */}
                    <div className="space-y-1">
                        <Label>Has Admin</Label>
                        <Select
                            value={hasAdminValue}
                            onValueChange={(val) =>
                                update({
                                    has_admin:
                                        val === "all" ? "" : val === "true",
                                })
                            }
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-md">
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Created After */}
                    <div className="space-y-1">
                        <Label>Created After</Label>
                        <Input
                            type="datetime-local"
                            value={draft.created_after || ""}
                            onChange={(e) => update({ created_after: e.target.value })}
                            className="border-neutral-300 bg-white/90"
                        />
                    </div>

                    {/* Created Before */}
                    <div className="space-y-1">
                        <Label>Created Before</Label>
                        <Input
                            type="datetime-local"
                            value={draft.created_before || ""}
                            onChange={(e) => update({ created_before: e.target.value })}
                            className="border-neutral-300 bg-white/90"
                        />
                    </div>

                    {/* Ordering */}
                    <div className="space-y-1">
                        <Label>Ordering</Label>
                        <Select
                            value={draft.ordering}
                            onValueChange={(val) => update({ ordering: val })}
                        >
                            <SelectTrigger className="border-neutral-300 bg-white/90">
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

                {/* FOOTER */}
                <SheetFooter className="border-t border-neutral-200 px-5 py-4 bg-white">
                    <div className="flex w-full items-center justify-between gap-2">
                        <Button
                            variant="ghost"
                            onClick={reset}
                            className="rounded-4xl px-4 py-5"
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
                                onClick={apply}
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

export default StoreFilters;
