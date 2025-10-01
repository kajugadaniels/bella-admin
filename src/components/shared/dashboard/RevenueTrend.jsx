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
    Legend,
} from "recharts";
import { superadmin } from "@/api";
import {
    startOfDayISO,
    endOfDayISO,
    amountOfOrder,
    statusOfOrder,
    currency as fmtCurrency,
    safeNum,
} from "./SAUtils";

/* ------------------------------- helpers ------------------------------- */
const isoDate = (d) => new Date(d).toISOString().slice(0, 10);
const isSameDay = (a, b) => isoDate(a) === isoDate(b);
const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
const DEFAULT_DAYS = 30;

function getWeekKey(date) {
    // ISO week key: YYYY-Www (Mon-based)
    const d = new Date(date);
    const tmp = new Date(d.getTime());
    tmp.setHours(0, 0, 0, 0);
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7)); // shift to Thu
    const week1 = new Date(tmp.getFullYear(), 0, 4);
    const isoWeek =
        1 +
        Math.round(
            ((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
        );
    return `${tmp.getFullYear()}-W${String(isoWeek).padStart(2, "0")}`;
}

function labelForKey(key, granularity) {
    if (granularity === "hourly") return `${key}:00`;
    return key; // daily: YYYY-MM-DD, weekly: YYYY-Www
}

/* ---------------------------------------------------------------------- */
export default function RevenueTrend() {
    // Independent date range (default last 30 days) and weekly granularity by default
    const [to, setTo] = useState(() => endOfDayISO(new Date()));
    const [from, setFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - (DEFAULT_DAYS - 1));
        return startOfDayISO(d);
    });
    const [granularity, setGranularity] = useState("weekly"); // weekly | daily | hourly(auto for single day)
    const [fromHour, setFromHour] = useState(0);
    const [toHour, setToHour] = useState(23);

    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);

    const isOneDay = useMemo(() => isSameDay(from, to), [from, to]);

    // Force hourly when single-day; revert to weekly otherwise (to preserve not-daily default UX)
    useEffect(() => {
        if (isOneDay) setGranularity("hourly");
        else if (granularity === "hourly") setGranularity("weekly");
    }, [isOneDay]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ordering: "-created_at",
                page: 1,
                page_size: 200,
                created_at_from: from,
                created_at_to: to,
            };
            const res = await superadmin.listOrders(params);
            const data =
                Array.isArray(res?.data?.results) ? res.data.results :
                    Array.isArray(res?.data?.data?.results) ? res.data.data.results :
                        Array.isArray(res?.data?.data) ? res.data.data :
                            Array.isArray(res?.data) ? res.data : [];
            setOrders(data);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("RevenueTrend load error:", e);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [from, to]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    /* ------------------------------- series ------------------------------- */
    const series = useMemo(() => {
        // key => { revenue, orders, paid, pending, cancelled }
        const map = new Map();

        const withinHour = (dateStr) => {
            const h = new Date(dateStr).getHours();
            return h >= clamp(fromHour, 0, 23) && h <= clamp(toHour, 0, 23);
        };

        const add = (key, amount, status) => {
            const row = map.get(key) || { revenue: 0, orders: 0, paid: 0, pending: 0, cancelled: 0 };
            row.revenue += amount;
            row.orders += 1;
            const s = (status || "").toUpperCase();
            if (s === "PAID" || s === "FULFILLED" || s === "CONFIRMED") row.paid += 1;
            else if (s === "CANCELLED") row.cancelled += 1;
            else row.pending += 1;
            map.set(key, row);
        };

        for (const o of orders) {
            const created = o?.created_at || o?.createdAt || o?.date || new Date().toISOString();
            if (granularity === "hourly" && isOneDay && !withinHour(created)) continue;

            const amount = safeNum(amountOfOrder(o));
            const status = statusOfOrder(o);

            let key = "";
            if (granularity === "hourly" && isOneDay) {
                key = String(new Date(created).getHours()).padStart(2, "0");
            } else if (granularity === "daily") {
                key = new Date(created).toISOString().slice(0, 10);
            } else {
                key = getWeekKey(created); // weekly
            }
            add(key, amount, status);
        }

        const keys = Array.from(map.keys()).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
        return keys.map((k) => ({
            date: labelForKey(k, granularity),
            ...map.get(k),
        }));
    }, [orders, granularity, isOneDay, fromHour, toHour]);

    /* ------------------------------ controls ------------------------------ */
    const onQuick = (range) => {
        const now = new Date();
        if (range === "today") {
            setFrom(startOfDayISO(now));
            setTo(endOfDayISO(now));
        } else if (range === "7d") {
            const d = new Date(now); d.setDate(d.getDate() - 6);
            setFrom(startOfDayISO(d));
            setTo(endOfDayISO(now));
        } else if (range === "30d") {
            const d = new Date(now); d.setDate(d.getDate() - 29);
            setFrom(startOfDayISO(d));
            setTo(endOfDayISO(now));
        }
    };

    /* --------------------------------- UI --------------------------------- */
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.24 }}
            className="rounded-2xl border border-neutral-200 bg-white/70 backdrop-blur p-4 sm:p-5"
            style={{ boxShadow: "0 10px 28px rgba(0,0,0,0.06)" }}
        >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-neutral-900">
                    Revenue & orders trend (independent)
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={granularity}
                        onChange={(e) => setGranularity(e.target.value)}
                        disabled={isOneDay /* hourly auto for single-day range */}
                        className="h-9 rounded-lg border border-neutral-300 bg-white/80 text-sm px-3"
                        aria-label="Granularity"
                        title={isOneDay ? "Hourly mode is auto-enabled for single-day range" : "Granularity"}
                    >
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                        {/* Hourly is auto for single-day */}
                    </select>

                    <input
                        type="date"
                        value={isoDate(from)}
                        onChange={(e) => {
                            const d = new Date(e.target.value || new Date());
                            setFrom(startOfDayISO(d));
                        }}
                        className="h-9 rounded-lg border border-neutral-300 bg-white/80 text-sm px-3"
                        aria-label="From date"
                    />
                    <input
                        type="date"
                        value={isoDate(to)}
                        onChange={(e) => {
                            const d = new Date(e.target.value || new Date());
                            setTo(endOfDayISO(d));
                        }}
                        className="h-9 rounded-lg border border-neutral-300 bg-white/80 text-sm px-3"
                        aria-label="To date"
                    />

                    <button
                        onClick={() => onQuick("today")}
                        className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-neutral-300 text-xs hover:bg-neutral-50"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => onQuick("7d")}
                        className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-neutral-300 text-xs hover:bg-neutral-50"
                    >
                        7d
                    </button>
                    <button
                        onClick={() => onQuick("30d")}
                        className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-neutral-300 text-xs hover:bg-neutral-50"
                    >
                        30d
                    </button>
                </div>
            </div>

            {/* Hour range controls (only for single-day range) */}
            {isOneDay && (
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-neutral-700">
                    <span className="opacity-80">Hour range:</span>
                    <select
                        value={fromHour}
                        onChange={(e) => setFromHour(clamp(parseInt(e.target.value, 10) || 0, 0, 23))}
                        className="h-8 rounded-lg border border-neutral-300 bg-white/80 px-2"
                        aria-label="From hour"
                    >
                        {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                            <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                        ))}
                    </select>
                    <span className="opacity-60">to</span>
                    <select
                        value={toHour}
                        onChange={(e) => setToHour(clamp(parseInt(e.target.value, 10) || 23, 0, 23))}
                        className="h-8 rounded-lg border border-neutral-300 bg-white/80 px-2"
                        aria-label="To hour"
                    >
                        {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                            <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                        ))}
                    </select>
                    <span className="opacity-60">(auto hourly for single-day range)</span>
                </div>
            )}

            {/* ----- Chart using your design: AreaChart + nested BarChart ----- */}
            <div className="h-64">
                <ResponsiveContainer>
                    <AreaChart data={series}>
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
                            formatter={(value, name, ctx) => {
                                // Show rich tooltip: revenue + total + breakdown
                                if (name === "revenue") return [fmtCurrency(value), "Revenue"];
                                if (name === "orders") {
                                    const p = ctx?.payload || {};
                                    const extra = ` (Paid: ${p.paid ?? 0}, Pending: ${p.pending ?? 0}, Cancelled: ${p.cancelled ?? 0})`;
                                    return [`${value}${extra}`, "Orders"];
                                }
                                return [value, name];
                            }}
                            labelFormatter={(label) =>
                                `${label} • ${granularity === "hourly" ? "Hourly" : granularity === "daily" ? "Daily" : "Weekly"}`
                            }
                        />
                        <Legend />

                        {/* Revenue (area) on right axis */}
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#spendGradient)"
                            name="revenue"
                        />

                        {/* Overlay: Orders (bars) on left axis */}
                        <BarChart data={series}>
                            <Bar
                                yAxisId="left"
                                dataKey="orders"
                                fill="#0ea5e9"
                                radius={[4, 4, 0, 0]}
                                name="orders"
                            />
                        </BarChart>
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {loading && (
                <div className="mt-2 text-center text-xs text-neutral-500">Loading trend…</div>
            )}
            {!loading && series.length === 0 && (
                <div className="mt-2 text-center text-xs text-neutral-500">No data in the selected range.</div>
            )}
        </motion.div>
    );
}
