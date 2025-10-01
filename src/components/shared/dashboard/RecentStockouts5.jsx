import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { formatDateTime, safeNum } from "./SAUtils";

export default function RecentStockouts5({ loading, rows }) {
    const data = useMemo(() => (rows || []).slice(0, 5).map((s) => ({
        id: s?.id,
        product: s?.product?.name || s?.stock_in?.product?.name || "Product",
        qty: safeNum(s?.quantity),
        reason: (s?.reason || "SALE").replaceAll("_", " ").toLowerCase(),
        created: formatDateTime(s?.created_at)
    })), [rows]);

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
                <h3 className="text-[15px] font-semibold text-neutral-900">Recent stock-outs</h3>
                <span className="text-xs text-neutral-500">Latest 5</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-neutral-500">
                            <th className="py-2.5 pr-3">Product</th>
                            <th className="py-2.5 px-3">Qty</th>
                            <th className="py-2.5 px-3">Reason</th>
                            <th className="py-2.5 pl-3">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr><td colSpan={4} className="py-6 text-center text-neutral-500">{loading ? "Loading…" : "No stock-outs."}</td></tr>
                        ) : data.map((r) => (
                            <tr key={r.id} className="border-t border-neutral-200/70">
                                <td className="py-3 pr-3 font-medium text-neutral-900 truncate max-w-[260px]">{r.product}</td>
                                <td className="py-3 px-3">{r.qty.toLocaleString()}</td>
                                <td className="py-3 px-3 capitalize">{r.reason}</td>
                                <td className="py-3 pl-3 text-neutral-600">{r.created}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
