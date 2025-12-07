import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function cn(...parts) {
    return parts.filter(Boolean).join(" ");
}

export default function NavItem({ to, icon: IconComponent, label, collapsed, end }) {
    const MotionDiv = motion.div;

    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 rounded-4xl px-3 py-3.5 text-sm transition-colors ring-0",
                    isActive
                        ? "bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 text-white shadow-sm"
                        : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                )
            }
        >
            <IconComponent className="h-[15px] w-[15px] shrink-0" />

            <AnimatePresence initial={false}>
                {!collapsed && (
                    <MotionDiv
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.18 }}
                        className="whitespace-nowrap"
                    >
                        {label}
                    </MotionDiv>
                )}
            </AnimatePresence>
        </NavLink>
    );
}
