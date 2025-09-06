import React, { useMemo, useState } from "react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
    Filter as FilterIcon,
    ChevronsUpDown,
    Check,
    Search,
} from "lucide-react";

/* ----------------------------- helpers (RW) ----------------------------- */
const uniqSort = (arr) =>
    Array.from(new Set((arr || []).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b))
    );

const safeProvinces = () => {
    try {
        const out = RW.Provinces?.();
        return uniqSort(Array.isArray(out) ? out : []);
    } catch {
        return [];
    }
};
const safeDistricts = (pv) => {
    if (!pv) return [];
    try {
        const out = RW.Districts?.(pv);
        return uniqSort(Array.isArray(out) ? out : []);
    } catch {
        return [];
    }
};
const safeSectors = (pv, dt) => {
    if (!pv || !dt) return [];
    try {
        const out = RW.Sectors?.(pv, dt);
        return uniqSort(Array.isArray(out) ? out : []);
    } catch {
        return [];
    }
};

/* --------------------------- Searchable Combobox --------------------------- */
const SearchableCombobox = ({
    value,
    onChange,
    placeholder = "Select…",
    options = [],
    disabled,
    className,
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
                    className={cn(
                        "w-full justify-between",
                        "bg-white/85 backdrop-blur-sm border-neutral-200 text-neutral-800",
                        "dark:bg-neutral-900/70 dark:text-neutral-100 dark:border-neutral-800",
                        className
                    )}
                    disabled={disabled}
                >
                    <span className={cn(!selected && "text-neutral-400")}>
                        {selected || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white/95 backdrop-blur-md border border-neutral-200 dark:bg-neutral-900/90 dark:border-neutral-800">
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
                                            onChange(val);
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

/* -------------------------------- ordering -------------------------------- */
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

/* -------------------------------- component -------------------------------- */
const StoreFilters = ({ value, onChange }) => {
    const v = value || {};
    const update = (patch) => onChange?.({ ...v, ...patch });

    // has_admin select mapping
    const hasAdminValue =
        v.has_admin === true ? "true" : v.has_admin === false ? "false" : "all";

    // RW lists
    const provinces = useMemo(() => safeProvinces(), []);
    const districts = useMemo(() => safeDistricts(v.province), [v.province]);
    const sectors = useMemo(() => safeSectors(v.province, v.district), [
        v.province,
        v.district,
    ]);

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
                {/* Search 30% */}
                <div className="flex basis-[30%] grow flex-col gap-1">
                    <Label className="text-[12px]">Search</Label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                        <Input
                            placeholder="Search by name, email, phone, address…"
                            value={v.search || ""}
                            onChange={(e) => update({ search: e.target.value })}
                            className="pl-9 border-neutral-300 bg-white/90 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/70"
                        />
                    </div>
                </div>

                {/* Province */}
                <div className="min-w-[180px] flex-1">
                    <Label className="text-[12px]">Province</Label>
                    <SearchableCombobox
                        value={v.province || ""}
                        onChange={(val) => {
                            update({
                                province: val,
                                district: "",
                                sector: "",
                            });
                        }}
                        options={provinces}
                        placeholder="Select province"
                    />
                </div>

                {/* District */}
                <div className="min-w-[180px] flex-1">
                    <Label className="text-[12px]">District</Label>
                    <SearchableCombobox
                        value={v.district || ""}
                        onChange={(val) => {
                            update({
                                district: val,
                                sector: "",
                            });
                        }}
                        options={districts}
                        disabled={!v.province}
                        placeholder="Select district"
                    />
                </div>

                {/* Sector */}
                <div className="min-w-[180px] flex-1">
                    <Label className="text-[12px]">Sector</Label>
                    <SearchableCombobox
                        value={v.sector || ""}
                        onChange={(val) => update({ sector: val })}
                        options={sectors}
                        disabled={!v.province || !v.district}
                        placeholder="Select sector"
                    />
                </div>

                {/* Has admin */}
                <div className="min-w-[150px] flex-1">
                    <Label className="text-[12px]">Has admin</Label>
                    <Select
                        value={hasAdminValue}
                        onValueChange={(val) =>
                            update({ has_admin: val === "all" ? "" : val === "true" })
                        }
                    >
                        <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Created after */}
                {/* <div className="min-w-[210px]">
                    <Label className="text-[12px]">Created after</Label>
                    <Input
                        type="datetime-local"
                        value={v.created_after || ""}
                        onChange={(e) => update({ created_after: e.target.value })}
                        className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800"
                    />
                </div> */}

                {/* Created before */}
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
            </div>

            {/* Mobile: compact search + filters trigger */}
            <div className="md:hidden space-y-2">
                <div className="rounded-2xl border border-neutral-200 bg-white/70 p-3 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/60">
                    <Label className="text-[12px]">Search</Label>
                    <div className="relative mt-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search by name, email, phone, address…"
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
                                <Label>Province</Label>
                                <SearchableCombobox
                                    value={v.province || ""}
                                    onChange={(val) => {
                                        update({ province: val, district: "", sector: "" });
                                    }}
                                    options={provinces}
                                    placeholder="Select province"
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label>District</Label>
                                <SearchableCombobox
                                    value={v.district || ""}
                                    onChange={(val) => update({ district: val, sector: "" })}
                                    options={districts}
                                    disabled={!v.province}
                                    placeholder="Select district"
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label>Sector</Label>
                                <SearchableCombobox
                                    value={v.sector || ""}
                                    onChange={(val) => update({ sector: val })}
                                    options={sectors}
                                    disabled={!v.province || !v.district}
                                    placeholder="Select sector"
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label>Has admin</Label>
                                <Select
                                    value={hasAdminValue}
                                    onValueChange={(val) =>
                                        update({ has_admin: val === "all" ? "" : val === "true" })
                                    }
                                >
                                    <SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="true">Yes</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
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
                            <div className="flex w-full items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setOpen(false);
                                    }}
                                    className="cursor-pointer"
                                >
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="cursor-pointer"
                                >
                                    Apply
                                </Button>
                            </div>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
};

export default StoreFilters;
