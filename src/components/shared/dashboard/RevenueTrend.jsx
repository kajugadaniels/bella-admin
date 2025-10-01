import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import { toast } from "sonner";
import { superadmin } from "@/api";
import {
    startOfDayISO,
    endOfDayISO,
    amountOfOrder,
    createdAtOfOrder,
    formatAsDayKey,
    formatAsHourKey,
    groupByDayKey,
    groupByHourKey,
    currency as formatCurrency,
    safeNum,
} from "./SAUtils";

/** yyyy-mm-dd (local) for <input type="date" /> */
function toDateInputValue(d) {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toISOString().slice(0, 10);
}
function fromDateInputValue(s) {
    // treat input as local midnight
    const [y, m, d] = (s || "").split("-").map((x) => parseInt(x, 10));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

/** Combined Orders (bars) & Revenue (area) over time (independent filters) */
export default function RevenueTrend({ loading: _parentLoading }) {
    // Own window: default last 30d
    const now = new Date();
    const defaultFrom = new Date(now); defaultFrom.setDate(now.getDate() - 29);
    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(now);

    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);

    const sameDay = useMemo(() => {
        const a = new Date(from), b = new Date(to);
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    }, [from, to]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ordering: "-created_at",
                page: 1,
                page_size: 250, // grab enough for trends
                created_after: startOfDayISO(from),
                created_before: endOfDayISO(to),
            };
            const res = await superadmin.listOrders(params);
            const raw =
                Array.isArray(res?.data?.results) ? res.data.results :
                    Array.isArray(res?.data?.data?.results) ? res.data.data.results :
                        Array.isArray(res?.data?.data) ? res.data.data :
                            Array.isArray(res?.data) ? res.data : [];

            setOrders(raw);
            setLastUpdated(new Date().toISOString());
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("RevenueTrend load error:", e);
            toast.error("Couldn’t load trend data.");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [from, to]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Build the trend series
    const data = useMemo(() => {
        if (!orders?.length) return [];

        if (sameDay) {
            // hourly buckets
            const map = groupByHourKey(
                orders,
                (o) => amountOfOrder(o),
                (o) => createdAtOfOrder(o),
            );
            return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
        }

        // daily buckets
        const map = groupByDayKey(
            orders,
            (o) => amountOfOrder(o),
            (o) => createdAtOfOrder(o),
        );

        // keep a continuous 30/7/whatever-day range so the chart looks good:
        const list = Array.from(map.values());
        return list.sort((a, b) => a.date.localeCompare(b.date));
    }, [orders, sameDay]);

    // Quick ranges
    const setToday = () => {
        const d = new Date();
        setFrom(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
        setTo(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    };
    const set7d = () => {
        const d = new Date();
        const f = new Date(d); f.setDate(d.getDate() - 6);
        setFrom(f);
        setTo(d);
    };
    const set30d = () => {
        const d = new Date();
        const f = new Date(d); f.setDate(d.getDate() - 29);
        setFrom(f);
        setTo(d);
    };

    const subTitle = sameDay ? "Hourly" : "Daily";
    const updatedText = lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleString()}` : "";

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
                <h3 className="text-[15px] font-semibold text-neutral-900">Orders & spend over time</h3>
                <span className="text-xs text-neutral-500">{subTitle} <span className="ml-2">{updatedText}</span></span>
            </div>

            {/* Independent controls */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <button
                    onClick={setToday}
                    className="h-8 rounded-lg border px-3 text-sm hover:bg-neutral-50"
                    disabled={loading}
                >
                    Today
                </button>
                <button
                    onClick={set7d}
                    className="h-8 rounded-lg border px-3 text-sm hover:bg-neutral-50"
                    disabled={loading}
                >
                    Last 7d
                </button>
                <button
                    onClick={set30d}
                    className="h-8 rounded-lg border px-3 text-sm hover:bg-neutral-50"
                    disabled={loading}
                >
                    Last 30d
                </button>

                <div className="ml-auto flex items-center gap-2">
                    <input
                        type="date"
                        value={toDateInputValue(from)}
                        onChange={(e) => {
                            const d = fromDateInputValue(e.target.value);
                            if (d) setFrom(d);
                        }}
                        className="h-8 rounded-lg border px-2 text-sm bg-white/90"
                    />
                    <span className="text-xs text-neutral-500">to</span>
                    <input
                        type="date"
                        value={toDateInputValue(to)}
                        onChange={(e) => {
                            const d = fromDateInputValue(e.target.value);
                            if (d) setTo(d);
                        }}
                        className="h-8 rounded-lg border px-2 text-sm bg-white/90"
                    />
                    <button
                        onClick={fetchOrders}
                        className="h-8 rounded-lg border px-3 text-sm hover:bg-neutral-50"
                        disabled={loading}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} allowDecimals={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                        <Tooltip
                            formatter={(value, name) => {
                                if (name === "spend" || name === "value") {
                                    // data uses { value, orders }. Show "spend" label for clarity.
                                    return [formatCurrency(value), "Spend"];
                                }
                                return [value, "Orders"];
                            }}
                        />
                        {/* Area: revenue */}
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#spendGradient)"
                        />
                        {/* Bars: order count */}
                        <BarChart data={data}>
                            <Bar yAxisId="left" dataKey="orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
