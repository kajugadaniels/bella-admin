import React from "react";
import { RefreshCw, BarChart3, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function SADashboardHeader({
    loading,
    lastRefreshedAt,
    from,
    to,
    onChangeFrom,
    onChangeTo,
    onQuick,
    onRefresh
}) {
    const last = lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleString() : "—";

    // Make ESLint see a concrete JS usage
    const MotionDiv = motion.div;

    return (
        <MotionDiv
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="mb-6 rounded-2xl border border-neutral-200/70 bg-white/60 backdrop-blur p-4 sm:p-5"
            style={{ boxShadow: "0 18px 50px rgba(0,0,0,0.06)" }}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 grid place-items-center rounded-xl bg-emerald-600 text-white">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-neutral-900">Superadmin dashboard</h1>
                        <p className="text-xs text-neutral-600">
                            Organization-wide insights. <span className="ml-2 text-neutral-500">Last refreshed: {last}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-2 h-9 px-2 rounded-lg border border-neutral-300 bg-white/90 text-sm">
                            <Calendar className="h-4 w-4 opacity-70" />
                            <input
                                type="date"
                                value={from?.slice(0, 10) || ""}
                                onChange={(e) => onChangeFrom?.(`${e.target.value}T00:00:00.000Z`)}
                                className="outline-none bg-transparent"
                                aria-label="From date"
                            />
                        </span>
                        <span className="inline-flex items-center gap-2 h-9 px-2 rounded-lg border border-neutral-300 bg-white/90 text-sm">
                            <Calendar className="h-4 w-4 opacity-70" />
                            <input
                                type="date"
                                value={to?.slice(0, 10) || ""}
                                onChange={(e) => onChangeTo?.(`${e.target.value}T23:59:59.999Z`)}
                                className="outline-none bg-transparent"
                                aria-label="To date"
                            />
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => onQuick?.("today")} className="h-9 px-3 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50">Today</button>
                        <button onClick={() => onQuick?.("7d")} className="h-9 px-3 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50">7d</button>
                        <button onClick={() => onQuick?.("30d")} className="h-9 px-3 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50">30d</button>
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50 disabled:opacity-60"
                            aria-label="Refresh"
                            title="Refresh"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        </MotionDiv>
    );
}
