import React from "react";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, Layers, PencilLine, CircleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import ExpiryBadge from "./ExpiryBadge";
import ProductThumb from "./ProductThumb";

function fmtNum(n) {
	if (n === null || n === undefined) return "—";
	const num = Number(n);
	if (isNaN(num)) return String(n);
	return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(num);
}
function dateOnly(iso) {
	if (!iso) return "—";
	try {
		return new Date(iso).toISOString().slice(0, 10);
	} catch {
		return iso;
	}
}

const ProductTable = ({
	rows,
	loading,
	publishBusy,
	onTogglePublish,
	onView,
	onEdit,
	onBatch,
}) => {
	return (
		<div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-black/5">
			<Table className="table-glassy">
				<TableHeader className="sticky top-0 bg-white/70 backdrop-blur">
					<TableRow>
						<TableHead>Product</TableHead>
						<TableHead>Store</TableHead>
						<TableHead className="text-right">Remaining</TableHead>
						<TableHead className="text-right">Discounted</TableHead>
						<TableHead className="text-right line-through">Original</TableHead>
						<TableHead className="text-right">Gross</TableHead>
						<TableHead className="text-right">Received</TableHead>
						<TableHead className="text-right">Expiry</TableHead>
						<TableHead className="text-center">Published</TableHead>
						<TableHead />
					</TableRow>
				</TableHeader>

				<TableBody>
					{loading && (
						<TableRow>
							<TableCell colSpan={10} className="py-10">
								<Skeleton className="h-8 w-full rounded-md" />
							</TableCell>
						</TableRow>
					)}

					{!loading && rows.length === 0 && (
						<TableRow>
							<TableCell colSpan={10} className="py-10 text-center text-neutral-500">
								<CircleAlert className="inline h-4 w-4 mr-2" />
								No products found.
							</TableCell>
						</TableRow>
					)}

					{!loading &&
						rows.map((s) => {
							const p = s.product || {};
							const store = s.store;
							const q = s.quantities || {};
							const v = s.pricing || {};
							const d = s.dates || {};

							const busy = publishBusy[p.id];

							return (
								<TableRow key={s.id} className="hover:bg-black/5 transition-colors">
									<TableCell>
										<div className="flex items-center gap-3">
											<ProductThumb src={p.image} alt={p.name} size={40} />
											<div>
												<div className="font-medium text-sm">{p.name}</div>

												{p.discount_rate > 0 && (
													<span className="text-xs text-amber-600">
														-{fmtNum(p.discount_rate)}% off
													</span>
												)}
											</div>
										</div>
									</TableCell>

									<TableCell>
										<div className="truncate text-sm">{store?.name || "Global"}</div>
										<Badge variant="secondary" className="glass-badge text-xs">
											{p.category || "UNCAT"}
										</Badge>
									</TableCell>

									<TableCell className="text-right">{fmtNum(q.remaining)}</TableCell>

									<TableCell className="text-right text-emerald-700 font-medium">
										{fmtNum(v.unit_price)}
									</TableCell>

									<TableCell className="text-right text-neutral-600 line-through">
										{fmtNum(p.discount_price)}
									</TableCell>

									<TableCell className="text-right">{fmtNum(v.value_gross)}</TableCell>

									<TableCell className="text-right">{dateOnly(d.received_at)}</TableCell>

									<TableCell className="text-right">
										{dateOnly(d.expiry_date)}
										<div>
											<ExpiryBadge expiryDate={d.expiry_date} />
										</div>
									</TableCell>

									<TableCell className="text-center">
										<Checkbox
											checked={!!p.published}
											disabled={busy}
											onCheckedChange={(v) =>
												onTogglePublish(p.id, !!v)
											}
											className="data-[state=checked]:bg-emerald-600"
										/>
									</TableCell>

									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													<Layers className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>

											<DropdownMenuContent align="end" className="glass-menu">
												<DropdownMenuItem
													onClick={() => onView(p.id)}
													className="cursor-pointer"
												>
													<Eye className="mr-2 h-4 w-4" />
													Product Details
												</DropdownMenuItem>

												<DropdownMenuItem
													onClick={() => onBatch(s.id)}
													className="cursor-pointer"
												>
													<Layers className="mr-2 h-4 w-4" />
													View Batch
												</DropdownMenuItem>

												<DropdownMenuItem
													onClick={() => onEdit(p.id)}
													className="cursor-pointer"
												>
													<PencilLine className="mr-2 h-4 w-4" />
													Edit Product
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							);
						})}
				</TableBody>
			</Table>
		</div>
	);
};

export default ProductTable;
