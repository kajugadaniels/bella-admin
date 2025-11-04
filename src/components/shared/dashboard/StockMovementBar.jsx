import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { toast } from "sonner";
import { superadmin } from "@/api";
import {
    startOfDayISO,
    endOfDayISO,
    safeNum,
    formatAsDayKey,
} from "./SAUtils";

/* ---------- tiny date helpers (local time, inclusive) ---------- */
function clampToLocalMidnight(d) {
    const dt = d instanceof Date ? d : new Date(d);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}
function toDateInputValue(d) {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toISOString().slice(0, 10);
}
function fromDateInputValue(s) {
    const [y, m, d] = (s || "").split("-").map((x) => parseInt(x, 10));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}
function enumerateDayKeys(from, to) {
    const start = clampToLocalMidnight(from);
    const end = clampToLocalMidnight(to);
    const out = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        out.push(formatAsDayKey(d));
    }
    return out;
}

/**
 * Independent Stock Movement chart
 * - Fetches StockIns via /superadmin/products/ (StockInProductListView)
 * - Fetches StockOuts via /superadmin/stockouts/
 * - Default window = Last 30 days (inclusive)
 * - Quick filters: Today, 7d, 30d + custom range
 * - Continuous date axis (fills zeros for missing days)
 * - Two lines: Stock-in qty vs Stock-out qty
 */
export default function StockMovementBar() {
    // default window: last 30 days (inclusive)
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(now.getDate() - 29);

    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(now);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    // raw results
    const [stockIns, setStockIns] = useState([]);   // /superadmin/products/
    const [stockOuts, setStockOuts] = useState([]); // /superadmin/stockouts/

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            // --- STOCK-INS (via products endpoint; uses created_after/created_before) ---
            const inParams = {
                ordering: "-created_at",
                page: 1,
                page_size: 250,
                created_after: startOfDayISO(from),
                created_before: endOfDayISO(to),
            };
            const inRes = await superadmin.listProductsViaStockIn(inParams);
            const ins =
                Array.isArray(inRes?.data?.results)
                    ? inRes.data.results
                    : Array.isArray(inRes?.data?.data?.results)
                        ? inRes.data.data.results
                        : Array.isArray(inRes?.data?.data)
                            ? inRes.data.data
                            : Array.isArray(inRes?.data)
                                ? inRes.data
                                : [];

            // --- STOCK-OUTS (uses created_at_from / created_at_to) ---
            const outParams = {
                ordering: "-created_at",
                page: 1,
                page_size: 250,
                created_at_from: startOfDayISO(from),
                created_at_to: endOfDayISO(to),
            };
            const outRes = await superadmin.listStockOuts(outParams);
            const outs =
                Array.isArray(outRes?.data?.results)
                    ? outRes.data.results
                    : Array.isArray(outRes?.data?.data?.results)
                        ? outRes.data.data.results
                        : Array.isArray(outRes?.data?.data)
                            ? outRes.data.data
                            : Array.isArray(outRes?.data)
                                ? outRes.data
                                : [];

            setStockIns(ins);
            setStockOuts(outs);
            setLastUpdated(new Date().toISOString());
        } catch (e) {
             
            console.error("StockMovementBar load error:", e);
            toast.error("Couldn’t load stock movement.");
            setStockIns([]);
            setStockOuts([]);
        } finally {
            setLoading(false);
        }
    }, [from, to]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Build continuous series by day, filling gaps with zeros
    const data = useMemo(() => {
        // aggregate into maps keyed by YYYY-MM-DD
        const inMap = new Map();
        for (const row of stockIns || []) {
            const dStr = row?.dates?.received_at || row?.created_at || row?.createdAt;
            const k = formatAsDayKey(dStr || new Date());
            const qty = safeNum(
                row?.quantities?.received ??
                row?.quantity ??
                row?.quantities?.remaining ?? // very defensive
                0
            );
            inMap.set(k, (inMap.get(k) || 0) + qty);
        }

        const outMap = new Map();
        for (const r of stockOuts || []) {
            const dStr = r?.created_at || r?.createdAt;
            const k = formatAsDayKey(dStr || new Date());
            const qty = safeNum(r?.quantity);
            outMap.set(k, (outMap.get(k) || 0) + qty);
        }

        // continuous keys
        return enumerateDayKeys(from, to).map((k) => ({
            date: k,
            in_qty: safeNum(inMap.get(k) || 0),
            out_qty: safeNum(outMap.get(k) || 0),
        }));
    }, [stockIns, stockOuts, from, to]);

    // Quick ranges
    const setToday = () => {
        const d = clampToLocalMidnight(new Date());
        setFrom(d);
        setTo(d);
    };
    const set7d = () => {
        const d = new Date();
        const f = new Date(d);
        f.setDate(d.getDate() - 6);
        setFrom(f);
        setTo(d);
    };
    const set30d = () => {
        const d = new Date();
        const f = new Date(d);
        f.setDate(d.getDate() - 29);
        setFrom(f);
        setTo(d);
    };

    const updatedText = lastUpdated
        ? `Updated ${new Date(lastUpdated).toLocaleString()}`
        : "";

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
                <span className="text-xs text-neutral-500">Daily <span className="ml-2">{updatedText}</span></span>
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
                        aria-label="From date"
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
                        aria-label="To date"
                    />
                    <button
                        onClick={fetchAll}
                        className="h-8 rounded-lg border px-3 text-sm hover:bg-neutral-50"
                        disabled={loading}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="in_qty"
                            name="Stock-in"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="out_qty"
                            name="Stock-out"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
