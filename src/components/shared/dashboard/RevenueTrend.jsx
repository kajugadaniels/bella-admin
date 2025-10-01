import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ResponsiveContainer,
    ComposedChart,
    Area,
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

// ----- helpers -----
const isoDate = (d) => new Date(d).toISOString().slice(0, 10);
const isSameDay = (a, b) => isoDate(a) === isoDate(b);
const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

function getWeekKey(date) {
    // ISO week key: YYYY-Www (Mon-based)
    const d = new Date(date);
    // Shift to nearest Thursday to get ISO week year
    const tmp = new Date(d.getTime());
    tmp.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
    const week1 = new Date(tmp.getFullYear(), 0, 4);
    const isoWeek =
        1 +
        Math.round(
            ((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
        );
    const wk = String(isoWeek).padStart(2, "0");
    return `${tmp.getFullYear()}-W${wk}`;
}

function padSeries(keys, map) {
    // Ensure we return rows in key order with zero defaults.
    return keys.map((k) => {
        const row = map.get(k) || { revenue: 0, paid: 0, pending: 0, cancelled: 0, total: 0 };
        return { key: k, ...row };
    });
}

function labelForKey(key, granularity) {
    if (granularity === "hourly") return `${key}:00`;
    return key; // daily: YYYY-MM-DD, weekly: YYYY-Www
}

const DEFAULT_DAYS = 30;

export default function RevenueTrend() {
    // independent date controls (default last 30 days, weekly)
    const [to, setTo] = useState(() => endOfDayISO(new Date()));
    const [from, setFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - (DEFAULT_DAYS - 1));
        return startOfDayISO(d);
    });

    // Granularity: weekly (default) | daily | hourly(auto when range is one day)
    const [granularity, setGranularity] = useState("weekly"); // NOT daily by default

    // Hour filter (active only when one-day range)
    const [fromHour, setFromHour] = useState(0);
    const [toHour, setToHour] = useState(23);

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);

    const isOneDay = useMemo(() => isSameDay(from, to), [from, to]);

    // If range is exactly 1 day, force hourly
    useEffect(() => {
        if (isOneDay) {
            setGranularity("hourly");
        } else if (granularity === "hourly") {
            // Move back to weekly when user widens the range (to keep non-daily default UX)
            setGranularity("weekly");
        }
    }, [isOneDay]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ordering: "-created_at",
                page: 1,
                page_size: 200, // reasonable top-N for trends
                created_at_from: from,
                created_at_to: to,
            };
            const res = await superadmin.listOrders(params);
            const data =
                Array.isArray(res?.data?.results) ? res.data.results :
                    Array.isArray(res?.data?.data?.results) ? res.data.data.results :
                        Array.isArray(res?.data?.data) ? res.data.data :
                            Array.isArray(res?.data) ? res.data : [];
            setRows(data);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("RevenueTrend load error:", e);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [from, to]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // ----- derive chart series -----
    const series = useMemo(() => {
        const map = new Map(); // key -> { revenue, paid, pending, cancelled, total }

        const add = (key, amount, status) => {
            const row = map.get(key) || { revenue: 0, paid: 0, pending: 0, cancelled: 0, total: 0 };
            row.revenue += amount;
            row.total += 1;
            const s = (status || "").toUpperCase();
            if (s === "PAID" || s === "FULFILLED" || s === "CONFIRMED") row.paid += 1;
            else if (s === "CANCELLED") row.cancelled += 1;
            else row.pending += 1;
            map.set(key, row);
        };

        const clampHour = (dateStr) => {
            const dt = new Date(dateStr);
            const h = dt.getHours();
            return h >= clamp(fromHour, 0, 23) && h <= clamp(toHour, 0, 23);
        };

        for (const o of rows) {
            const amount = safeNum(amountOfOrder(o));
            const status = statusOfOrder(o);
            const created = o?.created_at || o?.createdAt || o?.date || new Date().toISOString();

            let key = "";
            if (granularity === "hourly" && isOneDay) {
                if (!clampHour(created)) continue;
                const h = new Date(created).getHours();
                key = String(h).padStart(2, "0"); // "00".."23"
            } else if (granularity === "daily") {
                key = isoDate(created);
            } else {
                // weekly (default)
                key = getWeekKey(created);
            }
            add(key, amount, status);
        }

        // Sort keys naturally
        const keys = Array.from(map.keys()).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
        // Build rows in order, plus a pretty x-axis label
        return padSeries(keys, map).map((r) => ({
            ...r,
            label: labelForKey(r.key, granularity),
        }));
    }, [rows, granularity, isOneDay, fromHour, toHour]);

    // ----- UI controls -----
    const onQuick = (range) => {
        const now = new Date();
        if (range === "7d") {
            const d = new Date(now); d.setDate(d.getDate() - 6);
            setFrom(startOfDayISO(d)); setTo(endOfDayISO(now));
        } else if (range === "30d") {
            const d = new Date(now); d.setDate(d.getDate() - 29);
            setFrom(startOfDayISO(d)); setTo(endOfDayISO(now));
        } else if (range === "today") {
            setFrom(startOfDayISO(now)); setTo(endOfDayISO(now));
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-neutral-900">
                    Revenue & orders trend (independent)
                </h3>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={granularity}
                        onChange={(e) => setGranularity(e.target.value)}
                        disabled={isOneDay /* hourly will be forced */}
                        className="h-9 rounded-lg border border-neutral-300 bg-white/80 text-sm px-3"
                        aria-label="Granularity"
                        title={isOneDay ? "Hourly mode is auto-enabled for single-day range" : "Granularity"}
                    >
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                        {/* Hourly is reserved for single-day range */}
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

            <div className="h-72">
                <ResponsiveContainer>
                    <ComposedChart data={series}>
                        <defs>
                            <linearGradient id="revGradientInd" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 12 }}
                            width={60}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            allowDecimals={false}
                            tick={{ fontSize: 12 }}
                            width={48}
                        />
                        <Tooltip
                            formatter={(value, name) => {
                                if (name === "revenue") return [fmtCurrency(value), "Revenue"];
                                if (name === "paid") return [value, "Paid"];
                                if (name === "pending") return [value, "Pending"];
                                if (name === "cancelled") return [value, "Cancelled"];
                                if (name === "total") return [value, "Total orders"];
                                return [value, name];
                            }}
                            labelFormatter={(label) =>
                                `${label} • ${granularity === "hourly" ? "Hourly" : granularity === "daily" ? "Daily" : "Weekly"}`
                            }
                        />
                        <Legend />
                        {/* Revenue area (left axis) */}
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#revGradientInd)"
                            name="revenue"
                        />
                        {/* Orders breakdown (right axis) */}
                        <Bar
                            yAxisId="right"
                            dataKey="paid"
                            stackId="orders"
                            fill="#10b981"
                            name="paid"
                            radius={[3, 3, 0, 0]}
                        />
                        <Bar
                            yAxisId="right"
                            dataKey="pending"
                            stackId="orders"
                            fill="#f59e0b"
                            name="pending"
                            radius={[3, 3, 0, 0]}
                        />
                        <Bar
                            yAxisId="right"
                            dataKey="cancelled"
                            stackId="orders"
                            fill="#ef4444"
                            name="cancelled"
                            radius={[3, 3, 0, 0]}
                        />
                    </ComposedChart>
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
