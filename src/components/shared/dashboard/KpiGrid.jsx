import React from "react";
import KpiCard from "./KpiCard";
import { currency } from "./utils";
import { CircleDollarSign, PackageCheck, PackageOpen, ShoppingCart, Users } from "lucide-react";

export default function KpiGrid({ kpis }) {
    const {
        income = 0,
        ordersCount = 0,
        stockoutsQty = 0,
        onHandQty = 0,
        clientsCount = 0,
        ccy = "RWF",
    } = kpis || {};

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <KpiCard icon={CircleDollarSign} label="Income (Today)" value={currency(income, ccy)} hint="Paid orders" />
            <KpiCard icon={ShoppingCart} label="Orders (Today)" value={ordersCount} accent="from-sky-500 to-blue-600" />
            <KpiCard icon={PackageOpen} label="Stock-outs (Qty Today)" value={stockoutsQty} accent="from-amber-500 to-orange-600" />
            <KpiCard icon={PackageCheck} label="On-hand Qty" value={onHandQty} accent="from-violet-500 to-fuchsia-600" />
            <KpiCard icon={Users} label="Clients (All)" value={clientsCount} accent="from-rose-500 to-red-600" />
        </div>
    );
}
