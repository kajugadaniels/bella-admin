import React from "react";
import { GlassCard, Tiny } from "./utils";

export default function KpiCard({ icon: Icon, label, value, hint, accent = "from-emerald-500 to-teal-600" }) {
    return (
        <GlassCard className="p-4">
            <div className="flex items-center gap-3">
                <div
                    className={`grid h-12 w-12 place-items-center rounded-xl text-white ring-1 ring-black/5
                      bg-gradient-to-br ${accent}`}
                >
                    {Icon ? <Icon className="h-5 w-5" /> : null}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-500">{label}</div>
                    <div className="truncate text-xl font-semibold">{value}</div>
                    {hint ? <Tiny className="mt-0.5">{hint}</Tiny> : null}
                </div>
            </div>
        </GlassCard>
    );
}
