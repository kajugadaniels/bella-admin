import React from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, Tiny } from "./utils";

export default function DateControls({
	date,
	onChange,
	refreshing,
	onRefresh,
}) {
	const onToday = () => onChange?.(new Date());

	return (
		<GlassCard className="p-3 md:p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2">
					<CalendarDays className="h-5 w-5 opacity-70" />
					<div className="font-semibold">Dashboard</div>
					<Tiny className="ml-2">Daily snapshot by default</Tiny>
				</div>

				<div className="flex items-center gap-2">
					<input
						type="date"
						className="rounded-xl border px-3 py-2 text-sm outline-none transition-colors
                       border-neutral-200 bg-white/80 hover:bg-white
                       dark:border-neutral-800 dark:bg-neutral-900/70"
						value={new Date(date).toISOString().slice(0, 10)}
						onChange={(e) => {
							const v = e.target.value;
							if (v && v.length === 10) onChange?.(new Date(v + "T00:00:00"));
						}}
					/>
					<Button variant="secondary" onClick={onToday} className="rounded-xl">
						Today
					</Button>
					<Button
						variant="outline"
						onClick={onRefresh}
						className="rounded-xl"
						disabled={refreshing}
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						Refresh
					</Button>
				</div>
			</div>
		</GlassCard>
	);
}
