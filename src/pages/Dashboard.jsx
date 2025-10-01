import React, { useState } from "react";
import DateControls from "@/components/shared/dashboard/DateControls";
import KpiGrid from "@/components/shared/dashboard/KpiGrid";
import RevenueAreaChart from "@/components/shared/dashboard/RevenueAreaChart";
import TopProductsTable from "@/components/shared/dashboard/TopProductsTable";
import RecentOrdersTable from "@/components/shared/dashboard/RecentOrdersTable";
import RecentStockoutsTable from "@/components/shared/dashboard/RecentStockoutsTable";
import InventorySnapshot from "@/components/shared/dashboard/InventorySnapshot";
import DashboardSkeleton from "@/components/shared/dashboard/DashboardSkeleton";
import { GlassCard } from "@/components/shared/dashboard/utils";

const Dashboard = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const useDashboardData = require("@/components/shared/dashboard/useDashboardData").default; // avoids circular in some bundlers
    const { loading, refreshing, data, refetch } = useDashboardData(selectedDate);

    return (
        <div className="space-y-4">
            <DateControls date={selectedDate} onChange={setSelectedDate} refreshing={refreshing} onRefresh={refetch} />
            {loading ? (
                <DashboardSkeleton />
            ) : (
                <>
                    <KpiGrid kpis={data?.kpis} />

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <RevenueAreaChart hourly={data?.hourlyRevenue} />
                        <TopProductsTable items={data?.topProducts} ccy={data?.ccy} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <RecentOrdersTable orders={data?.recentOrders} ccy={data?.ccy} />
                        <RecentStockoutsTable rows={data?.recentStockouts} ccy={data?.ccy} />
                    </div>

                    <InventorySnapshot rows={data?.inventoryTop} ccy={data?.ccy} />

                    {/* subtle footer / notes */}
                    <GlassCard className="p-3">
                        <div className="text-xs text-neutral-500">
                            Daily filters limit queries to the selected date (00:00–23:59). Inventory snapshot shows current on-hand
                            (not date-filtered). Use the date picker above to explore another day.
                        </div>
                    </GlassCard>
                </>
            )}
        </div>
    );
};

export default Dashboard;
