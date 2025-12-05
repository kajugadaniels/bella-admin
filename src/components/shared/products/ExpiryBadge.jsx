import React from "react";

/**
 * ExpiryBadge: shows days-left and color-codes the badge.
 * Accepts expiryDate (ISO string or date-like).
 */

function daysUntil(dateStr) {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export default function ExpiryBadge({ expiryDate }) {
    const d = daysUntil(expiryDate);
    if (d === null) return null;

    let cls = "border text-xs px-2.5 py-0.5 rounded-full inline-block";
    let text = "";
    if (d <= 0) {
        cls += " bg-red-100 text-red-700 border-red-200";
        text = d === 0 ? "Today" : "Expired";
    } else if (d <= 2) {
        cls += " bg-red-100 text-red-700 border-red-200";
        text = `${d}d left`;
    } else if (d <= 7) {
        cls += " bg-amber-100 text-amber-700 border-amber-200";
        text = `${d}d left`;
    } else {
        cls += " bg-emerald-100 text-emerald-700 border-emerald-200";
        text = `${d}d left`;
    }

    return <span className={cls}>{text}</span>;
}
