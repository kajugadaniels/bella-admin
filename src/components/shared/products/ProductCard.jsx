import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import ProductThumb from "./ProductThumb";
import ExpiryBadge from "./ExpiryBadge";

function fmtNum(n) {
	if (n === null || n === undefined) return "—";
	const num = Number(n);
	if (isNaN(num)) return String(n);
	return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(num);
}

const ProductCard = ({
	row,
	publishBusy,
	onTogglePublish,
	onView,
	onEdit,
	onBatch
}) => {
	const p = row.product || {};
	const store = row.store;
	const q = row.quantities || {};
	const v = row.pricing || {};
	const d = row.dates || {};

	const busy = publishBusy?.[p.id];

	return (
		<div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur">
			<div className="flex justify-between items-start gap-3">
				<div className="flex items-center gap-3 min-w-0">
					<ProductThumb src={p.image} alt={p.name} />

					<div className="min-w-0">
						<div className="truncate font-medium">{p.name ?? "Product"}</div>

						{p.discount_rate > 0 && (
							<Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
								-{fmtNum(p.discount_rate)}%
							</Badge>
						)}

						<div className="flex items-center flex-wrap gap-1 text-xs text-neutral-500 mt-1">
							<Badge variant="secondary" className="glass-badge">
								{p.category || "UNCAT"}
							</Badge>
							<span>· {store?.name || "Global"}</span>
							<span>· {d.received_at?.slice(0,10) || "—"}</span>
							{d.expiry_date && (
								<span>· <ExpiryBadge expiryDate={d.expiry_date} /></span>
							)}
						</div>
					</div>
				</div>

				<Checkbox
					checked={!!p.published}
					disabled={busy}
					onCheckedChange={(v) => onTogglePublish(p.id, !!v)}
					aria-label="Toggle publish"
					className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
				/>
			</div>

			<div className="grid grid-cols-2 gap-2 text-sm mt-3">
				<div className="rounded-xl border p-2 bg-white/60">
					<div className="text-xs text-neutral-500">Remaining</div>
					<div className="font-semibold">{fmtNum(q.remaining)}</div>
				</div>

				<div className="rounded-xl border p-2 bg-white/60">
					<div className="text-xs text-neutral-500">Received</div>
					<div className="font-semibold">{fmtNum(q.received)}</div>
				</div>

				<div className="rounded-xl border p-2 bg-white/60">
					<div className="text-xs text-neutral-500">Discounted</div>
					<div className="font-semibold text-emerald-700">
						{fmtNum(v.unit_price)}
					</div>
				</div>

				<div className="rounded-xl border p-2 bg-white/60">
					<div className="text-xs text-neutral-500">Original</div>
					<div className="font-semibold line-through text-neutral-500">
						{fmtNum(p.discount_price)}
					</div>
				</div>
			</div>

			<div className="flex justify-end gap-2 mt-4">
				<Button size="sm" variant="outline" onClick={() => onBatch(row.id)}>
					Batch
				</Button>
				<Button size="sm" variant="outline" onClick={() => onEdit(p.id)}>
					Edit
				</Button>
				<Button size="sm" variant="outline" onClick={() => onView(p.id)}>
					Details
				</Button>
			</div>
		</div>
	);
};

export default ProductCard;
