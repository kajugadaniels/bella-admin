import React from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

/** Daily Stock-in vs Stock-out quantities */
export default function StockMovementBar({ loading, data }) {
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
                <h3 className="text-[15px] font-semibold text-neutral-900">Stock movement (qty)</h3>
                <span className="text-xs text-neutral-500">Daily</span>
            </div>

            <div className="h-64">
                <ResponsiveContainer>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="in_qty" name="Stock-in" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="out_qty" name="Stock-out" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
