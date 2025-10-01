import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function TopProductsTable({ loading, rows }) {
    const data = (rows || []).slice(0, 5);

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
                <h3 className="text-[15px] font-semibold text-neutral-900">Top products (by stock-out qty)</h3>
                <Link to="/products" className="text-sm text-emerald-700 hover:underline inline-flex items-center gap-1">
                    View catalog <ExternalLink className="h-4 w-4" />
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-neutral-500">
                            <th className="py-2.5 pr-3">Product</th>
                            <th className="py-2.5 px-3">Qty</th>
                            <th className="py-2.5 pl-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="py-6 text-center text-neutral-500">
                                    {loading ? "Loading…" : "No data for the selected period."}
                                </td>
                            </tr>
                        ) : (
                            data.map((r) => (
                                <tr key={r.id} className="border-t border-neutral-200/70">
                                    <td className="py-3 pr-3">
                                        <div className="flex items-center gap-3">
                                            {r.image ? (
                                                <img
                                                    src={r.image}
                                                    alt={r.name}
                                                    className="h-10 w-10 rounded-md object-cover border border-neutral-200"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-md bg-neutral-100" />
                                            )}
                                            <div className="font-medium text-neutral-900 truncate max-w-[320px]">{r.name}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3">{Number(r.qty).toLocaleString()}</td>
                                    <td className="py-3 pl-3">
                                        <Link to={`/products/${r.id}`} className="text-emerald-700 hover:underline">Open</Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
