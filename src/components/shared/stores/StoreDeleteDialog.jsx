import React, { useEffect, useMemo, useState } from "react";
import * as RW from "rwanda";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
    Funnel,
    Search,
    ChevronsUpDown,
    Check,
    RotateCcw,
} from "lucide-react";

/* -------------------- Options (keep aligned with backend) ------------------- */
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

/* ---------------- Rwanda helpers (defensive around lib versions) ----------- */
const uniqSort = (arr) =>
    Array.from(new Set((arr || []).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b))
    );

const provincesList = () => {
    try {
        return uniqSort(RW.Provinces?.() || []);
    } catch {
        return [];
    }
};
const districtsList = (province) => {
    if (!province) return [];
    try {
        return uniqSort(RW.Districts?.(province) || []);
    } catch {
        return [];
    }
};
const sectorsList = (province, district) => {
    if (!province || !district) return [];
    try {
        return uniqSort(RW.Sectors?.(province, district) || []);
    } catch {
        return [];
    }
};

/* ----------------- Reusable searchable combobox (shadcn) ------------------- */
const SearchableCombobox = ({
    value,
    onChange,
    placeholder = "Select…",
    options = [],
    className,
    disabled,
}) => {
    const [open, setOpen] = useState(false);
    const selected = value || "";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    disabled={disabled}
                >
                    <span className={cn(!selected && "text-neutral-400")}>
                        {selected || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search…" />
                    <CommandEmpty>No results.</CommandEmpty>
                    <CommandList className="max-h-64 overflow-y-auto">
                        <CommandGroup>
                            {options.map((opt) => {
                                const isActive =
                                    String(selected).toLowerCase() === String(opt).toLowerCase();
                                return (
                                    <CommandItem
                                        key={opt}
                                        value={opt}
                                        onSelect={(val) => {
                                            onChange?.(val);
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

/* ---------------------------- Advanced fields ----------------------------- */
const AdvancedFields = ({ v, update }) => {
    // dependent lists
    const provinces = useMemo(() => provincesList(), []);
    const districts = useMemo(() => districtsList(v.province), [v.province]);
    const sectors = useMemo(
        () => sectorsList(v.province, v.district),
        [v.province, v.district]
    );

    // normalize select for has_admin
    const hasAdminValue =
        v.has_admin === true ? "true" : v.has_admin === false ? "false" : "all";

    // keep downstream coherence
    useEffect(() => {
        // if province cleared, drop district/sector
        if (!v.province && (v.district || v.sector)) {
            update({ district: "", sector: "" });
        }
    }, [v.province]); // eslint-disable-line

    useEffect(() => {
        // if district cleared, drop sector
        if (!v.district && v.sector) {
            update({ sector: "" });
        }
    }, [v.district]); // eslint-disable-line

    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* Province (combobox) */}
            <div className="grid gap-1.5">
                <Label>Province</Label>
                <SearchableCombobox
                    value={v.province || ""}
                    options={provinces}
                    placeholder="Select province"
                    onChange={(val) =>
                        update({
                            province: val,
                            district: "",
                            sector: "",
                        })
                    }
                />
            </div>

            {/* District (combobox) */}
            <div className="grid gap-1.5">
                <Label>District</Label>
                <SearchableCombobox
                    value={v.district || ""}
                    options={districts}
                    placeholder="Select district"
                    onChange={(val) =>
                        update({
                            district: val,
                            sector: "",
                        })
                    }
                    disabled={!v.province}
                />
            </div>

            {/* Sector (combobox) */}
            <div className="grid gap-1.5">
                <Label>Sector</Label>
                <SearchableCombobox
                    value={v.sector || ""}
                    options={sectors}
                    placeholder="Select sector"
                    onChange={(val) => update({ sector: val })}
                    disabled={!v.province || !v.district}
                />
            </div>

            {/* Has admin */}
            <div className="grid gap-1.5">
                <Label>Has admin</Label>
                <Select
                    value={hasAdminValue}
                    onValueChange={(val) =>
                        update({
                            has_admin: val === "all" ? "" : val === "true",
                        })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Created after */}
            <div className="grid gap-1.5">
                <Label htmlFor="created_after">Created after</Label>
                <Input
                    id="created_after"
                    type="datetime-local"
                    value={v.created_after || ""}
                    onChange={(e) => update({ created_after: e.target.value })}
                />
            </div>

            {/* Created before */}
            <div className="grid gap-1.5">
                <Label htmlFor="created_before">Created before</Label>
                <Input
                    id="created_before"
                    type="datetime-local"
                    value={v.created_before || ""}
                    onChange={(e) => update({ created_before: e.target.value })}
                />
            </div>

            {/* Ordering */}
            <div className="grid gap-1.5 lg:col-span-3">
                <Label>Ordering</Label>
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
    );
};

/* --------------------------------- Main UI -------------------------------- */
const StoreFilters = ({ value, onChange, onReset }) => {
    const v = value || {};
    const update = (patch) => onChange?.({ ...v, ...patch });

    const hardReset = () => {
        const cleared = {
            search: "",
            province: "",
            district: "",
            sector: "",
            has_admin: "",
            created_after: "",
            created_before: "",
            ordering: "-created_at",
        };
        onChange?.(cleared);
        onReset?.();
    };

    return (
        <div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/40">
            {/* Top row: search + mobile actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Search input (bordered) */}
                <div className="relative w-full">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
                    <Input
                        value={v.search || ""}
                        onChange={(e) => update({ search: e.target.value })}
                        placeholder="Search by name, email, phone, address…"
                        className="pl-9 border-neutral-300 focus-visible:ring-0"
                    />
                </div>

                {/* Mobile: open sheet */}
                <div className="flex items-center gap-2 sm:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <Funnel className="mr-2 h-4 w-4" />
                                Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>Advanced filters</SheetTitle>
                            </SheetHeader>

                            <div className="mt-4 space-y-4">
                                <AdvancedFields v={v} update={update} />
                            </div>

                            <Separator className="my-4" />
                            <SheetFooter className="flex w-full items-center justify-between">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-red-600"
                                    onClick={hardReset}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                                <SheetClose asChild>
                                    <Button type="button">Apply</Button>
                                </SheetClose>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>

                    {/* Quick reset (mobile) */}
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-red-600"
                        onClick={hardReset}
                        title="Reset all filters"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>

                {/* Desktop / tablet: reset button on right */}
                <div className="ml-auto hidden sm:flex">
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-red-600"
                        onClick={hardReset}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                </div>
            </div>

            {/* Advanced fields inline (≥ lg) */}
            <div className="mt-3 hidden lg:block">
                <AdvancedFields v={v} update={update} />
            </div>
        </div>
    );
};

export default StoreFilters;
