import React, { useMemo } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const StoreFilters = ({ value, onChange }) => {
    const v = value || {};
    const update = (patch) => onChange?.({ ...v, ...patch });

    return (
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
                <Label htmlFor="province">Province</Label>
                <Input
                    id="province"
                    placeholder="e.g., Kigali"
                    value={v.province || ""}
                    onChange={(e) => update({ province: e.target.value })}
                />
            </div>
            <div>
                <Label htmlFor="district">District</Label>
                <Input
                    id="district"
                    placeholder="e.g., Gasabo"
                    value={v.district || ""}
                    onChange={(e) => update({ district: e.target.value })}
                />
            </div>
            <div>
                <Label htmlFor="sector">Sector</Label>
                <Input
                    id="sector"
                    placeholder="e.g., Kimironko"
                    value={v.sector || ""}
                    onChange={(e) => update({ sector: e.target.value })}
                />
            </div>
            <div>
                <Label>Has admin</Label>
                <Select
                    value={String(v.has_admin ?? "")}
                    onValueChange={(val) => update({ has_admin: val === "" ? "" : val === "true" })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="created_after">Created after</Label>
                <Input
                    id="created_after"
                    type="datetime-local"
                    value={v.created_after || ""}
                    onChange={(e) => update({ created_after: e.target.value })}
                />
            </div>
            <div>
                <Label htmlFor="created_before">Created before</Label>
                <Input
                    id="created_before"
                    type="datetime-local"
                    value={v.created_before || ""}
                    onChange={(e) => update({ created_before: e.target.value })}
                />
            </div>

            <div className="lg:col-span-2">
                <Label>Ordering</Label>
                <Select value={v.ordering || "-created_at"} onValueChange={(val) => update({ ordering: val })}>
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

export default StoreFilters;
