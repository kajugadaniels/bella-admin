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
    formatAsDayKey,
    formatAsHourKey,
    safeNum,
} from "./SAUtils";
import { formatPrice } from "@/components/shared/checkout/utils";

/** Internal helper: yyyy-mm-dd */
function todayStr(d = new Date()) {
    return d.toISOString().slice(0, 10);
}
function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}
function clampTimeStr(v, def) {
    // simple HH:MM guard
    if (!v || typeof v !== "string" || !/^\d{2}:\d{2}$/.test(v)) return def;
    return v;
}

/** Combined Orders (bars) & Spend (area) over time — independent component */
export default function RevenueTrend({ loading: _loadingFromParent }) {
    // --- Local date range (independent) ---
    const defaultTo = todayStr(new Date());
    const defaultFrom = todayStr(addDays(new Date(), -29)); // last 30 days inclusive

    const [fromDate, setFromDate] = useState(defaultFrom);
    const [toDate, setToDate] = useState(defaultTo);

    // Hourly filter only applies when fromDate === toDate
    const isSingleDay = fromDate && toDate && fromDate === toDate;
    const [fromTime, setFromTime] = useState("00:00");
    const [toTime, setToTime] = useState("23:59");

    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

    const createdAtFromISO = useMemo(() => {
        const base = isSingleDay ? `${fromDate}T${clampTimeStr(fromTime, "00:00")}:00` : `${fromDate}T00:00:00`;
        return startOfDayISO(new Date(base));
    }, [fromDate, fromTime, isSingleDay]);

    const createdAtToISO = useMemo(() => {
        const base = isSingleDay ? `${toDate}T${clampTimeStr(toTime, "23:59")}:59` : `${toDate}T23:59:59`;
        return endOfDayISO(new Date(base));
    }, [toDate, toTime, isSingleDay]);

    const fetchOrders = useCallback(async () => {
        if (!fromDate || !toDate) return;
        setLoading(true);
        try {
            const res = await superadmin.listOrders({
                ordering: "-created_at",
                page: 1,
                page_size: 500, // generous for charts
                created_at_from: createdAtFromISO,
                created_at_to: createdAtToISO,
            });

            const raw =
                Array.isArray(res?.data?.results) ? res.data.results :
                    Array.isArray(res?.data?.data?.results) ? res.data.data.results :
                        Array.isArray(res?.data?.data) ? res.data.data :
                            Array.isArray(res?.data) ? res.data : [];
            setOrders(raw);
            setLastRefreshedAt(new Date().toISOString());
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("RevenueTrend load error:", e);
            toast.error("Couldn’t load orders for the selected range.");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [createdAtFromISO, createdAtToISO, fromDate, toDate]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Currency guess
    const currency = useMemo(() => {
        const first = orders?.[0];
        return (first?.currency || "RWF").toUpperCase();
    }, [orders]);

    // Aggregate: hourly vs daily
    const data = useMemo(() => {
        if (!Array.isArray(orders) || orders.length === 0) return [];
        // Paid-ish revenue: use amountOfOrder; only count when paid/fulfilled/confirmed or payment_status=PAID
        const isPaidish = (o) =>
            String(o?.payment_status || "").toUpperCase() === "PAID" ||
            ["PAID", "FULFILLED", "CONFIRMED"].includes(String(o?.status || "").toUpperCase());

        const byKey = new Map(); // key => { date, orders, spend }
        for (const o of orders) {
            const t = o?.created_at || o?.createdAt || o?.date;
            const key = isSingleDay ? formatAsHourKey(t) : formatAsDayKey(t);
            const row = byKey.get(key) || { date: key, orders: 0, spend: 0 };
            row.orders += 1;
            if (isPaidish(o)) row.spend += safeNum(amountOfOrder(o));
            byKey.set(key, row);
        }
        // sort by date key
        return Array.from(byKey.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
    }, [orders, isSingleDay]);

    const headerRightLabel = isSingleDay ? "Hourly" : "Daily";

    const onQuick = (range) => {
        const now = new Date();
        if (range === "7d") {
            const d = addDays(now, -6);
            setFromDate(todayStr(d));
            setToDate(todayStr(now));
        } else if (range === "30d") {
            const d = addDays(now, -29);
            setFromDate(todayStr(d));
            setToDate(todayStr(now));
        } else if (range === "today") {
            const d = todayStr(now);
            setFromDate(d);
            setToDate(d);
            setFromTime("00:00");
            setToTime("23:59");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.24 }}
            className="rounded-2xl border border-neutral-200 bg-white/70 backdrop-blur p-4 sm:p-5"
            style={{ boxShadow: "0 10px 28px rgba(0,0,0,0.06)" }}
        >
            {/* Header */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-[15px] font-semibold text-neutral-900">Orders & spend over time</h3>
                    <div className="text-xs text-neutral-500">
                        {headerRightLabel}
                        {lastRefreshedAt ? (
                            <span className="ml-2 text-neutral-400">Updated {new Date(lastRefreshedAt).toLocaleString()}</span>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Quick ranges */}
                    <button
                        onClick={() => onQuick("today")}
                        className="h-8 rounded-lg border border-neutral-300 bg-white/80 px-2.5 text-xs hover:bg-neutral-50"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => onQuick("7d")}
                        className="h-8 rounded-lg border border-neutral-300 bg-white/80 px-2.5 text-xs hover:bg-neutral-50"
                    >
                        Last 7d
                    </button>
                    <button
                        onClick={() => onQuick("30d")}
                        className="h-8 rounded-lg border border-neutral-300 bg-white/80 px-2.5 text-xs hover:bg-neutral-50"
                    >
                        Last 30d
                    </button>

                    {/* Date range */}
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="h-8 rounded-lg border border-neutral-300 bg-white/80 px-2.5 text-xs"
                        aria-label="From date"
                    />
                    <span className="text-xs text-neutral-500">to</span>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="h-8 rounded-lg border border-neutral-300 bg-white/80 px-2.5 text-xs"
                        aria-label="To date"
                    />

                    {/* Hourly filter when single-day */}
                    {isSingleDay && (
                        <>
                            <input
                                type="time"
                                value={fromTime}
                                onChange={(e) => setFromTime(clampTimeStr(e.target.value, "00:00"))}
                                className="h-8 rounded-lg border border-neutral-300 bg-white/80 px-2.5 text-xs"
                                aria-label="From time"
                            />
                            <span className="text-xs text-neutral-500">to</span>
                            <input
                                type="time"
                                value={toTime}
                                onChange={(e) => setToTime(clampTimeStr(e.target.value, "23:59"))}
                                className="h-8 rounded-lg border border-neutral-300 bg-white/80 px-2.5 text-xs"
                                aria-label="To time"
                            />
                        </>
                    )}

                    <button
                        onClick={fetchOrders}
                        disabled={loading}
                        className="h-8 rounded-lg border border-neutral-300 bg-white/80 px-2.5 text-xs hover:bg-neutral-50 disabled:opacity-60"
                        aria-label="Refresh"
                        title="Refresh"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Chart */}
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
                                if (name === "spend") return [formatPrice(value, currency), "Spend"];
                                return [value, "Orders"];
                            }}
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="spend"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#spendGradient)"
                        />
                        <BarChart data={data}>
                            <Bar yAxisId="left" dataKey="orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
