// Lightweight utils tailored for the Superadmin dashboard
export const pad2 = (n) => String(n).padStart(2, "0");

export function startOfDayISO(d) {
    const dt = d instanceof Date ? d : new Date(d);
    const y = dt.getFullYear(), m = dt.getMonth(), day = dt.getDate();
    const z = new Date(Date.UTC(y, m, day, 0, 0, 0, 0));
    return z.toISOString();
}
export function endOfDayISO(d) {
    const dt = d instanceof Date ? d : new Date(d);
    const y = dt.getFullYear(), m = dt.getMonth(), day = dt.getDate();
    const z = new Date(Date.UTC(y, m, day, 23, 59, 59, 999));
    return z.toISOString();
}

export function safeNum(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
}

export function currency(amount, ccy = "RWF") {
    const n = safeNum(amount);
    try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
    } catch {
        return `${n.toLocaleString()} ${ccy}`;
    }
}

export function formatDateTime(input) {
    if (!input) return "—";
    try {
        return new Date(input).toLocaleString();
    } catch {
        return String(input);
    }
}

export function statusOfOrder(o) {
    return (o?.status || o?.order_status || o?.payment_status || "PENDING").toUpperCase();
}
export function amountOfOrder(o) {
    return safeNum(o?.grand_total ?? o?.total ?? o?.amount ?? 0);
}

/** Group an array into a Map keyed by YYYY-MM-DD, summing `valueOf(row)` and counting */
export function groupByDayKey(arr, valueOf, dateOf) {
    const m = new Map();
    for (const it of arr || []) {
        const d = new Date(dateOf(it) || Date.now());
        const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
        const prev = m.get(key) || { date: key, value: 0, orders: 0 };
        prev.value += safeNum(valueOf(it));
        prev.orders += 1;
        m.set(key, prev);
    }
    return m;
}
