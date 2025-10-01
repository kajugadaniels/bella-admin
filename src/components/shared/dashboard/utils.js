export function startOfDayISO(d) {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt.toISOString();
}
export function endOfDayISO(d) {
    const dt = new Date(d);
    dt.setHours(23, 59, 59, 999);
    return dt.toISOString();
}
export function currency(n, ccy = "RWF") {
    if (n == null) return "—";
    const v = Number(n);
    if (Number.isNaN(v)) return `${n}`;
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v) + (ccy ? ` ${ccy}` : "");
}
export function GlassCard({ className = "", children }) {
    return (
        <div
            className={[
                "rounded-2xl border p-4",
                "border-neutral-200/80 bg-white/70 backdrop-blur-md",
                "dark:border-neutral-800 dark:bg-neutral-900/60",
                className,
            ].join(" ")}
        >
            {children}
        </div>
    );
}
export function Tiny({ children, className = "" }) {
    return <div className={["text-xs text-neutral-500", className].join(" ")}>{children}</div>;
}
export function SectionTitle({ icon: Icon, children }) {
    return (
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {children}
        </div>
    );
}
