import React from "react";
import { motion } from "framer-motion";
import {
    Wallet, PackageCheck, Clock, XCircle, Gauge, PackageOpen, TrendingUp, Users, CheckCircle2
} from "lucide-react";
import { currency } from "./SAUtils";

function StatCard({ title, value, hint, icon, accentClass = "" }) {
    // Make ESLint see a concrete JS usage
    const MotionDiv = motion.div;

    return (
        <MotionDiv
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.24 }}
            className="rounded-2xl border border-neutral-200 bg-white/70 backdrop-blur p-4 sm:p-5"
            style={{ boxShadow: "0 10px 28px rgba(0,0,0,0.06)" }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-neutral-600">{title}</div>
                    <div className="mt-1 text-xl font-bold text-neutral-900">{value}</div>
                    {hint ? <div className="text-[11px] mt-0.5 text-neutral-500">{hint}</div> : null}
                </div>
                <div className={`h-10 w-10 grid place-items-center rounded-xl ${accentClass}`}>
                    {icon && <icon className="h-5 w-5" />}
                </div>
            </div>
        </MotionDiv>
    );
}

export default function SAStatsCards({ kpis }) {
    const {
        revenue = 0,
        ordersCount = 0,
        paidCount = 0,
        pendingCount = 0,
        cancelledCount = 0,
        avgOrder = 0,
        stockinQty = 0,
        stockoutsQty = 0,
        stockValueNet = 0,
        stockValueGross = 0,
        newClients = 0,
        productsPublished = 0,
        productsTotal = 0
    } = kpis || {};

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard title="Revenue" value={currency(revenue)} hint={`AOV: ${currency(avgOrder)}`} icon={Wallet} accentClass="bg-neutral-900 text-white" />
            <StatCard title="Orders" value={ordersCount} hint={`${paidCount} paid • ${pendingCount} pending`} icon={PackageCheck} accentClass="bg-emerald-600 text-white" />
            <StatCard title="Cancelled" value={cancelledCount} icon={XCircle} accentClass="bg-red-100 text-red-700" />
            <StatCard title="Stock-in (qty)" value={stockinQty.toLocaleString()} icon={PackageOpen} accentClass="bg-sky-100 text-sky-700" />
            <StatCard title="Stock-out (qty)" value={stockoutsQty.toLocaleString()} icon={Gauge} accentClass="bg-amber-100 text-amber-700" />
            <StatCard title="Stock value" value={currency(stockValueGross)} hint={`Net ${currency(stockValueNet)}`} icon={TrendingUp} accentClass="bg-emerald-100 text-emerald-700" />

            <StatCard title="New clients" value={newClients} icon={Users} accentClass="bg-indigo-100 text-indigo-700" />
            <StatCard title="Published products" value={`${productsPublished}/${productsTotal}`} icon={CheckCircle2} accentClass="bg-teal-100 text-teal-700" />
        </div>
    );
}
