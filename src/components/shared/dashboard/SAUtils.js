// Lightweight utils tailored for the Superadmin dashboard

export const pad2 = (n) => String(n).padStart(2, "0");

/* ------------------------------- ISO helpers ------------------------------ */
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

/* ------------------------------- number utils ----------------------------- */
export function safeNum(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
}

/* ---------------------------- formatting helpers -------------------------- */
export function currency(amount, ccy = "RWF") {
    const n = safeNum(amount);
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: ccy,
            maximumFractionDigits: 0,
        }).format(n);
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

/* ------------------------------ order helpers ----------------------------- */
/** Accepts both full order and summary shapes */
export function statusOfOrder(o) {
    return (
        (o?.order_status ||
            o?.status ||
            o?.payment_status ||
            "PENDING") + ""
    ).toUpperCase();
}

/** Accepts both full order and summary shapes */
export function amountOfOrder(o) {
    // supports summary: order_grand_total; canonical: grand_total; generic fallbacks
    return safeNum(
        o?.order_grand_total ??
        o?.grand_total ??
        o?.total ??
        o?.amount ??
        0
    );
}

/** Normalized created_at for grouping (summary or canonical) */
export function createdAtOfOrder(o) {
    return o?.order_created_at || o?.created_at || o?.createdAt || o?.date || null;
}

/* --------------------------- key builders --------------------------------- */
export function formatAsDayKey(input) {
    const d = new Date(input ?? Date.now());
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function formatAsHourKey(input) {
    const d = new Date(input ?? Date.now());
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:00`;
}

/* -------------------------- grouping helpers ------------------------------ */
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
export function groupByHourKey(arr, valueOf, dateOf) {
    const m = new Map();
    for (const it of arr || []) {
        const d = new Date(dateOf(it) || Date.now());
        const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:00`;
        const prev = m.get(key) || { date: key, value: 0, orders: 0 };
        prev.value += safeNum(valueOf(it));
        prev.orders += 1;
        m.set(key, prev);
    }
    return m;
}
