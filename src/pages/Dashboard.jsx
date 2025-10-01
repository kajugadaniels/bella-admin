import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { superadmin } from "@/api";
import SADashboardHeader from "@/components/shared/dashboard/SADashboardHeader";
import SAStatsCards from "@/components/shared/dashboard/SAStatsCards";
import RevenueTrend from "@/components/shared/dashboard/RevenueTrend";
import OrdersByStatusPie from "@/components/shared/dashboard/OrdersByStatusPie";
import StockMovementBar from "@/components/shared/dashboard/StockMovementBar";
import TopProductsTable from "@/components/shared/dashboard/TopProductsTable";
import RecentOrders5 from "@/components/shared/dashboard/RecentOrders5";
import RecentStockouts5 from "@/components/shared/dashboard/RecentStockouts5";
import {
    startOfDayISO,
    endOfDayISO,
    groupByDayKey,
    amountOfOrder,
    statusOfOrder,
    safeNum,
} from "@/components/shared/dashboard/SAUtils";

export default function Dashboard() {
    // Default: TODAY
    const [from, setFrom] = useState(() => startOfDayISO(new Date()));
    const [to, setTo] = useState(() => endOfDayISO(new Date()));
    const [loading, setLoading] = useState(true);
    const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

    // Raw payloads
    const [orders, setOrders] = useState([]);
    const [stockouts, setStockouts] = useState([]);
    const [stockinBatches, setStockinBatches] = useState([]); // via /superadmin/products/ (StockIn rows)
    const [clients, setClients] = useState([]);
    const [productsCount, setProductsCount] = useState({ published: 0, total: 0 });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            // ✅ Use backend’s expected keys
            const baseParams = {
                ordering: "-created_at",
                page: 1,
                page_size: 100,
                created_at_from: from,
                created_at_to: to,
            };

            // Orders (latest 100 in range)
            const oRes = await superadmin.listOrders(baseParams);
            const oRaw =
                Array.isArray(oRes?.data?.results) ? oRes.data.results :
                    Array.isArray(oRes?.data?.data?.results) ? oRes.data.data.results :
                        Array.isArray(oRes?.data?.data) ? oRes.data.data :
                            Array.isArray(oRes?.data) ? oRes.data : [];

            // Stockouts (latest 100 in range)
            const soRes = await superadmin.listStockOuts(baseParams);
            const soRaw =
                Array.isArray(soRes?.data?.results) ? soRes.data.results :
                    Array.isArray(soRes?.data?.data?.results) ? soRes.data.data.results :
                        Array.isArray(soRes?.data?.data) ? soRes.data.data :
                            Array.isArray(soRes?.data) ? soRes.data : [];

            // StockIns (batches) via products endpoint (aggregate quantities/values)
            const siRes = await superadmin.listProductsViaStockIn({
                ...baseParams,
                has_store: undefined, // keep defaults
            });
            const siRaw =
                Array.isArray(siRes?.data?.results) ? siRes.data.results :
                    Array.isArray(siRes?.data?.data?.results) ? siRes.data.data.results :
                        Array.isArray(siRes?.data?.data) ? siRes.data.data :
                            Array.isArray(siRes?.data) ? siRes.data : [];

            // Clients in range
            const cRes = await superadmin.listClients(baseParams);
            const cRaw =
                Array.isArray(cRes?.data?.results) ? cRes.data.results :
                    Array.isArray(cRes?.data?.data?.results) ? cRes.data.data.results :
                        Array.isArray(cRes?.data?.data) ? cRes.data.data :
                            Array.isArray(cRes?.data) ? cRes.data : [];

            // Products quick counts (published vs all) – two cheap queries
            const pAllRes = await superadmin.listProductsViaStockIn({ page: 1, page_size: 1, ordering: "-created_at" });
            const pAllTotal = Number(
                pAllRes?.headers?.["x-total-count"] ??
                pAllRes?.data?.count ??
                pAllRes?.data?.data?.count ?? 0
            );

            const pPubRes = await superadmin.listProductsViaStockIn({
                page: 1, page_size: 1, ordering: "-created_at", "product__publish": true
            });
            const pPubTotal = Number(
                pPubRes?.headers?.["x-total-count"] ??
                pPubRes?.data?.count ??
                pPubRes?.data?.data?.count ?? 0
            );

            setOrders(oRaw);
            setStockouts(soRaw);
            setStockinBatches(siRaw);
            setClients(cRaw);
            setProductsCount({ published: pPubTotal, total: pAllTotal });
            setLastRefreshedAt(new Date().toISOString());
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Superadmin dashboard load error:", e);
            toast.error("Couldn’t load dashboard data.");
            setOrders([]); setStockouts([]); setStockinBatches([]); setClients([]);
        } finally {
            setLoading(false);
        }
    }, [from, to]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ---- DERIVED KPI ----
    // Revenue = sum(grand_total or equivalent) for PAID-like statuses
    const kpis = useMemo(() => {
        let revenue = 0;
        let ordersCount = 0;
        let paidCount = 0;
        let cancelledCount = 0;
        let pendingCount = 0;

        for (const o of orders) {
            ordersCount += 1;
            const status = statusOfOrder(o);
            const amount = amountOfOrder(o);

            const paidish =
                (o?.payment_status || "").toUpperCase() === "PAID" ||
                ["PAID", "FULFILLED", "CONFIRMED"].includes(status);

            if (paidish) {
                revenue += amount;
                paidCount += 1;
            } else if (status === "CANCELLED") {
                cancelledCount += 1;
            } else {
                pendingCount += 1;
            }
        }

        // Stock-ins received quantity & value (in range)
        let stockinQty = 0;
        let stockValueNet = 0;
        let stockValueGross = 0;
        for (const b of stockinBatches) {
            const q = safeNum(b?.quantity ?? b?.remaining ?? b?.quantities?.received);
            stockinQty += q;
            const vn = safeNum(b?.value_net ?? b?.pricing?.value_net);
            const vg = safeNum(b?.value_gross ?? b?.pricing?.value_gross);
            stockValueNet += vn;
            stockValueGross += vg;
        }

        const stockoutsQty = stockouts.reduce((s, r) => s + safeNum(r?.quantity), 0);
        const newClients = clients.length;

        // Simple AOV
        const avgOrder = ordersCount ? revenue / ordersCount : 0;

        return {
            revenue,
            ordersCount,
            paidCount,
            pendingCount,
            cancelledCount,
            avgOrder,
            stockinQty,
            stockoutsQty,
            stockValueNet,
            stockValueGross,
            newClients,
            productsPublished: productsCount.published,
            productsTotal: productsCount.total,
        };
    }, [orders, stockouts, stockinBatches, clients, productsCount]);

    // Trend: Revenue by day (grouped)
    const revenueTrend = useMemo(() => {
        const map = groupByDayKey(
            orders,
            (o) => amountOfOrder(o),
            (o) => o?.created_at || o?.createdAt || o?.date
        );
        return Array.from(map.values()); // [{ date: 'YYYY-MM-DD', value, orders }]
    }, [orders]);

    // Orders status pie
    const statusPie = useMemo(() => {
        const counts = new Map();
        for (const o of orders) {
            const s = statusOfOrder(o);
            counts.set(s, (counts.get(s) || 0) + 1);
        }
        return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    }, [orders]);

    // Stock movement bar: received vs issued per day
    const stockMovement = useMemo(() => {
        // group stock-ins by day (quantity), and stockouts by day (quantity)
        const insMap = groupByDayKey(
            stockinBatches,
            (b) => safeNum(b?.quantity ?? b?.quantities?.received),
            (b) => b?.created_at
        );
        const outsMap = groupByDayKey(
            stockouts,
            (s) => safeNum(s?.quantity),
            (s) => s?.created_at
        );
        // unify keys
        const keys = Array.from(new Set([...insMap.keys(), ...outsMap.keys()])).sort();
        return keys.map((d) => ({
            date: d,
            in_qty: safeNum(insMap.get(d)?.value),
            out_qty: safeNum(outsMap.get(d)?.value),
        }));
    }, [stockinBatches, stockouts]);

    // Top products by sales proxy (stock-out quantity within range)
    const topProducts = useMemo(() => {
        const byProd = new Map();
        for (const s of stockouts) {
            const p = s?.product || s?.stock_in?.product;
            const pid = p?.id || s?.stock_in?.product_id || s?.product_id;
            if (!pid) continue;
            const name = p?.name || "Product";
            const img = (p?.image && (typeof p.image === "string" ? p.image : p.image?.url)) || null;
            const qty = safeNum(s?.quantity);
            const cur = byProd.get(pid) || { id: pid, name, image: img, qty: 0 };
            cur.qty += qty;
            byProd.set(pid, cur);
        }
        return Array.from(byProd.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
    }, [stockouts]);

    return (
        <div className="relative">
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/60 via-white to-white" />
            <div className="pointer-events-none absolute -top-24 right-[-120px] h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-[-80px] h-80 w-80 rounded-full bg-emerald-100/30 blur-3xl" />

            <div className="max-w-[1480px] mx-auto">
                <SADashboardHeader
                    loading={loading}
                    lastRefreshedAt={lastRefreshedAt}
                    from={from}
                    to={to}
                    onChangeFrom={setFrom}
                    onChangeTo={setTo}
                    onQuick={(range) => {
                        const now = new Date();
                        if (range === "today") {
                            setFrom(startOfDayISO(now));
                            setTo(endOfDayISO(now));
                        } else if (range === "7d") {
                            const d = new Date(now); d.setDate(d.getDate() - 6);
                            setFrom(startOfDayISO(d)); setTo(endOfDayISO(now));
                        } else if (range === "30d") {
                            const d = new Date(now); d.setDate(d.getDate() - 29);
                            setFrom(startOfDayISO(d)); setTo(endOfDayISO(now));
                        }
                    }}
                    onRefresh={fetchAll}
                />

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-12">
                        <SAStatsCards loading={loading} kpis={kpis} />
                    </div>

                    <div className="xl:col-span-7">
                        <RevenueTrend loading={loading} data={revenueTrend} />
                    </div>

                    <div className="xl:col-span-5">
                        <OrdersByStatusPie loading={loading} data={statusPie} />
                    </div>

                    <div className="xl:col-span-12">
                        <StockMovementBar loading={loading} data={stockMovement} />
                    </div>

                    <div className="xl:col-span-7">
                        <TopProductsTable loading={loading} rows={topProducts} />
                    </div>

                    <div className="xl:col-span-5">
                        <RecentStockouts5 loading={loading} rows={stockouts} />
                    </div>

                    <div className="xl:col-span-12">
                        <RecentOrders5 loading={loading} rows={orders} />
                    </div>
                </div>
            </div>
        </div>
    );
}
