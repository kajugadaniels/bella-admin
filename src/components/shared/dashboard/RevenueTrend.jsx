import React from "react";
import { motion } from "framer-motion";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from "recharts";
import { currency } from "./SAUtils";

/** Daily revenue (area) with order count bars */
export default function RevenueTrend({ loading, data }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.24 }}
            className="rounded-2xl border border-neutral-200 bg-white/70 backdrop-blur p-4 sm:p-5"
            style={{ boxShadow: "0 10px 28px rgba(0,0,0,0.06)" }}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-semibold text-neutral-900">Revenue & orders over time</h3>
                <span className="text-xs text-neutral-500">Daily</span>
            </div>

            <div className="h-64">
                <ResponsiveContainer>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip
                            formatter={(value, name) => {
                                if (name === "value") return [currency(value), "Revenue"];
                                return [value, "Orders"];
                            }}
                        />
                        <Area yAxisId="left" type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#revGradient)" />
                        <BarChart data={data}>
                            <Bar yAxisId="right" dataKey="orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
