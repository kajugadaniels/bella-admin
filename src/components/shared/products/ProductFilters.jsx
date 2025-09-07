import React, { useState, memo } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Exported so the parent can share the same defaults */
export const DEFAULT_PRODUCT_FILTERS = {
    category: "",
    has_store: "",
    has_remaining: "",
    is_void: "",
    min_unit_price: "",
    max_unit_price: "",
    expiring_after: "",
    expiring_before: "",
    created_after: "",
    created_before: "",
};

function ProductFiltersBase({ value, onChange, className }) {
    const [open, setOpen] = useState(false);
    const v = value || DEFAULT_PRODUCT_FILTERS;

    const set = (patch) => onChange?.({ ...v, ...patch });
    const reset = () => onChange?.({ ...DEFAULT_PRODUCT_FILTERS });

    return (
        <div
            className={[
                "rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur-md",
                "dark:border-white/10 dark:bg-neutral-900/60",
                className || "",
            ].join(" ")}
        >
            <div className="flex flex-wrap items-center gap-3">
                {/* Category */}
                <div className="grid min-w-[220px] flex-1 gap-1.5">
                    <Label htmlFor="pf-category" className="text-xs text-neutral-500">
                        Category
                    </Label>
                    <Input
                        id="pf-category"
                        placeholder="e.g., DAIRY, DRINKS, BAKERY…"
                        value={v.category || ""}
                        onChange={(e) => set({ category: e.target.value })}
                        className="glass-input"
                    />
                </div>

                {/* Toggles */}
                <div className="grid gap-1.5">
                    <Label className="text-xs text-neutral-500">Has store</Label>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={!!v.has_store}
                            onCheckedChange={(c) => set({ has_store: c ? true : "" })}
                        />
                        <span className="text-sm">Only with store</span>
                    </div>
                </div>

                <div className="grid gap-1.5">
                    <Label className="text-xs text-neutral-500">Has remaining</Label>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={!!v.has_remaining}
                            onCheckedChange={(c) => set({ has_remaining: c ? true : "" })}
                        />
                        <span className="text-sm">Remaining &gt; 0</span>
                    </div>
                </div>

                <div className="grid gap-1.5">
                    <Label className="text-xs text-neutral-500">Voided</Label>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={!!v.is_void}
                            onCheckedChange={(c) => set({ is_void: c ? true : "" })}
                        />
                        <span className="text-sm">Include voided</span>
                    </div>
                </div>

                {/* More filters + Reset */}
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={reset}
                        className="glass-button cursor-pointer"
                    >
                        Reset
                    </Button>

                    <DropdownMenu open={open} onOpenChange={setOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="glass-button cursor-pointer"
                            >
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                More filters
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-menu w-80 p-3">
                            <div className="grid gap-3">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Min unit price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={v.min_unit_price ?? ""}
                                        onChange={(e) => set({ min_unit_price: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Max unit price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={v.max_unit_price ?? ""}
                                        onChange={(e) => set({ max_unit_price: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs">Expiring after</Label>
                                        <Input
                                            type="date"
                                            value={v.expiring_after || ""}
                                            onChange={(e) => set({ expiring_after: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs">Expiring before</Label>
                                        <Input
                                            type="date"
                                            value={v.expiring_before || ""}
                                            onChange={(e) => set({ expiring_before: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs">Created after</Label>
                                        <Input
                                            type="datetime-local"
                                            value={v.created_after || ""}
                                            onChange={(e) => set({ created_after: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs">Created before</Label>
                                        <Input
                                            type="datetime-local"
                                            value={v.created_before || ""}
                                            onChange={(e) => set({ created_before: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Active filters summary */}
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {Object.entries(v)
                                        .filter(([_, val]) => val !== "" && val !== null && val !== undefined)
                                        .map(([k]) => (
                                            <Badge key={k} variant="secondary" className="glass-badge">
                                                {k.replaceAll("_", " ")}
                                            </Badge>
                                        ))}
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}

const ProductFilters = memo(ProductFiltersBase);
export default ProductFilters;
