import { useCallback, useEffect, useMemo, useState } from "react";
import { superadmin } from "@/api";
import { startOfDayISO, endOfDayISO } from "./utils";
import { toast } from "sonner";

/**
 * Fetches and assembles daily dashboard data.
 * Notes:
 *  - Uses page_size=100 to limit pagination pressure (adjust if backend allows).
 *  - Sums revenue from orders with payment_status=PAID (fallback: include all).
 */
export default function useDashboardData(selectedDate) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({
        kpis: {},
        hourlyRevenue: [],
        topProducts: [],
        recentOrders: [],
        recentStockouts: [],
        inventoryTop: [],
        ccy: "RWF",
    });

    const created_after = useMemo(() => startOfDayISO(selectedDate), [selectedDate]);
    const created_before = useMemo(() => endOfDayISO(selectedDate), [selectedDate]);

    const fetchAll = useCallback(async (isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);

            // ---- Orders (today) ----
            const ordRes = await superadmin.listOrders({
                created_after,
                created_before,
                ordering: "-created_at",
                page_size: 100,
            });
            const orders = Array.isArray(ordRes?.data?.results) ? ordRes.data.results : [];

            // income: sum grand_total for PAID
            const incomePaid = orders
                .filter((o) => String(o?.payment_status || "").toUpperCase() === "PAID")
                .reduce((acc, o) => acc + Number(o?.grand_total || 0), 0);

            const ccy = orders[0]?.currency || "RWF";

            // Hourly revenue buckets (for orders considered "PAID")
            const buckets = Array.from({ length: 24 }).map((_, hour) => ({ hour, amount: 0 }));
            orders.forEach((o) => {
                const isPaid = String(o?.payment_status || "").toUpperCase() === "PAID";
                const dt = o?.created_at ? new Date(o.created_at) : null;
                if (isPaid && dt) {
                    const h = dt.getHours();
                    buckets[h].amount += Number(o?.grand_total || 0);
                }
            });

            // ---- Stock-outs (today) ----
            const soRes = await superadmin.listStockOuts({
                created_after,
                created_before,
                ordering: "-created_at",
                page_size: 100,
            });
            const stockouts = Array.isArray(soRes?.data?.results) ? soRes.data.results : [];
            const stockoutsQty = stockouts.reduce((acc, r) => acc + Number(r?.quantity || 0), 0);

            // Build "top products today" from stockouts (gross value today)
            const topMap = new Map();
            stockouts.forEach((r) => {
                const pid = r?.product?.id;
                const key = pid || r.id;
                const unitPrice = Number(r?.unit_price || r?.product?.unit_price || 0);
                const qty = Number(r?.quantity || 0);
                const gross = unitPrice * qty;
                const prev = topMap.get(key) || { id: key, name: r?.product?.name, category: r?.product?.category, unitPrice, qtyOut: 0, gross: 0 };
                prev.qtyOut += qty;
                prev.gross += gross;
                topMap.set(key, prev);
            });
            const topProducts = Array.from(topMap.values()).sort((a, b) => b.gross - a.gross).slice(0, 10);

            // ---- Inventory snapshot (overall): use StockIn via products, top remaining ----
            const invRes = await superadmin.listProductsViaStockIn({
                has_remaining: true,
                ordering: "-product_remaining_total",
                page_size: 20,
            });
            const invRows = Array.isArray(invRes?.data?.results) ? invRes.data.results : [];
            // unify shape
            const inventoryTop = invRows.map((r) => ({
                id: r?.id,
                product: {
                    id: r?.product?.id,
                    name: r?.product?.name,
                    category: r?.product?.category,
                    unit_price: r?.product?.unit_price,
                },
                remaining: r?.remaining ?? r?.product_remaining_total ?? 0,
                value_gross: r?.value_gross ?? 0,
            }));

            // ---- Clients (count only, optional) ----
            let clientsCount = 0;
            try {
                const clientsRes = await superadmin.listClients({ page_size: 1 });
                clientsCount = Number(clientsRes?.data?.count || 0);
            } catch {
                // ignore if endpoint differs
            }

            setData({
                kpis: {
                    income: incomePaid,
                    ordersCount: orders.length,
                    stockoutsQty,
                    onHandQty: inventoryTop.reduce((a, r) => a + Number(r.remaining || 0), 0),
                    clientsCount,
                    ccy,
                },
                hourlyRevenue: buckets,
                topProducts,
                recentOrders: orders.slice(0, 10),
                recentStockouts: stockouts.slice(0, 10),
                inventoryTop,
                ccy,
            });
        } catch (err) {
            toast.error(err?.message || "Failed to load dashboard");
        } finally {
            isRefresh ? setRefreshing(false) : setLoading(false);
        }
    }, [created_after, created_before]);

    useEffect(() => {
        fetchAll(false);
    }, [fetchAll]);

    return {
        loading,
        refreshing,
        data,
        refetch: () => fetchAll(true),
    };
}
