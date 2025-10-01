import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { currency, formatDateTime, amountOfOrder, statusOfOrder } from "./SAUtils";

function StatusBadge({ status }) {
    const s = (status || "PENDING").toUpperCase();
    const cls = s === "PAID"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : s === "CANCELLED"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-amber-50 text-amber-700 border-amber-200";
    const label = s[0] + s.slice(1).toLowerCase();
    return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 h-7 text-xs ${cls}`}>{label}</span>;
}

export default function RecentOrders5({ loading, rows }) {
    const data = useMemo(() => (rows || []).slice(0, 5).map((o) => ({
        id: o?.id,
        code: o?.code || o?.id,
        status: statusOfOrder(o),
        total: amountOfOrder(o),
        created: formatDateTime(o?.created_at || o?.createdAt || o?.date),
        currency: (o?.currency || "RWF").toUpperCase()
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
                <h3 className="text-[15px] font-semibold text-neutral-900">Recent orders</h3>
                <Link to="/orders" className="text-sm text-emerald-700 hover:underline inline-flex items-center gap-1">
                    View all <ExternalLink className="h-4 w-4" />
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-neutral-500">
                            <th className="py-2.5 pr-3">Order</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Total</th>
                            <th className="py-2.5 pl-3">Placed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr><td colSpan={4} className="py-6 text-center text-neutral-500">{loading ? "Loading…" : "No recent orders."}</td></tr>
                        ) : data.map((r) => (
                            <tr key={r.id} className="border-t border-neutral-200/70">
                                <td className="py-3 pr-3 font-medium text-neutral-900">{r.code}</td>
                                <td className="py-3 px-3"><StatusBadge status={r.status} /></td>
                                <td className="py-3 px-3 font-semibold">{currency(r.total, r.currency)}</td>
                                <td className="py-3 pl-3 text-neutral-600">{r.created}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
