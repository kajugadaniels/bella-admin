import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { GlassCard, SectionTitle, currency } from "./utils";
import { LineChart as LineIcon } from "lucide-react";

function fmtHourLabel(h) {
    return h?.toString().padStart(2, "0") + ":00";
}
function tipFormatter(v) {
    return currency(v);
}

export default function RevenueAreaChart({ hourly }) {
    const data = (hourly || []).map((d) => ({ hour: fmtHourLabel(d.hour), amount: Number(d.amount || 0) }));
    return (
        <GlassCard className="p-4">
            <SectionTitle icon={LineIcon}>Revenue by hour (Today)</SectionTitle>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="currentColor" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis dataKey="hour" />
                        <YAxis tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                        <Tooltip formatter={tipFormatter} />
                        <Area type="monotone" dataKey="amount" stroke="currentColor" fill="url(#revGrad)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
