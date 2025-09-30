// src/components/shared/orders/OrderTable.jsx
import React from 'react';
import { Eye, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function currency(amount, ccy) {
	if (amount === null || amount === undefined) return '—';
	const n = Number(amount);
	if (Number.isNaN(n)) return `${amount} ${ccy || ''}`.trim();
	return `${n.toLocaleString()}${ccy ? ` ${ccy}` : ''}`;
}

const statusBadgeVariant = (s) => {
	switch ((s || '').toUpperCase()) {
		case 'PAID':
		case 'FULFILLED':
			return 'default';
		case 'PENDING':
		case 'CONFIRMED':
			return 'secondary';
		case 'CANCELLED':
		case 'REFUNDED':
			return 'destructive';
		default:
			return 'outline';
	}
};

const OrderCard = ({ o, onView }) => {
	const d = o?.__display || {};
	const created = o?.order_created_at ? new Date(o.order_created_at) : null;
	return (
		<div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/50">
			<div className="flex items-start gap-3">
				<div
					className="h-8 w-8 shrink-0 rounded-lg grid place-items-center text-[11px] font-semibold text-white ring-1 ring-black/5 dark:ring-white/10"
					style={{ background: 'linear-gradient(135deg, var(--primary-color), #059669)' }}
				>
					PO
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<div className="truncate text-sm font-semibold">{d.code}</div>
						<Badge variant={statusBadgeVariant(o?.order_status)} className="glass-badge">
							{o?.order_status || '—'}
						</Badge>
						<Badge variant={statusBadgeVariant(o?.payment_status)} className="glass-badge">
							{o?.payment_status || '—'}
						</Badge>
					</div>
					<div className="truncate text-xs text-neutral-500">{d.clientName}</div>

					<div className="mt-2 grid grid-cols-3 gap-2 text-xs">
						<div className="rounded-lg bg-black/[0.03] p-2 dark:bg-white/[0.06]">
							<div className="text-neutral-500">Total</div>
							<div className="font-medium">{currency(d.total, o?.currency)}</div>
						</div>
						<div className="rounded-lg bg-black/[0.03] p-2 dark:bg-white/[0.06]">
							<div className="text-neutral-500">Products</div>
							<div className="font-medium">{o?.product_count ?? '—'}</div>
						</div>
						<div className="rounded-lg bg-black/[0.03] p-2 dark:bg-white/[0.06]">
							<div className="text-neutral-500">Created</div>
							<div className="font-medium">{created ? created.toISOString().slice(0, 10) : '—'}</div>
						</div>
					</div>

					<div className="mt-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() => onView?.(o)}
							className="glass-button px-6 py-4 rounded-4xl"
						>
							<Eye className="mr-2 h-4 w-4" />
							View
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

const OrderTable = ({ rows = [], loading = false, onView }) => {
	const empty = !loading && (!rows || rows.length === 0);

	return (
		<>
			{/* Mobile: cards */}
			<div className="md:hidden">
				{loading && (
					<div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50">
						Loading orders…
					</div>
				)}
				{empty && (
					<div className="rounded-xl border border-black/5 bg-white/70 p-4 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50">
						No orders found.
					</div>
				)}
				{!loading &&
					rows?.map((o) => (
						<div key={o.order_id} className="mb-3">
							<OrderCard o={o} onView={onView} />
						</div>
					))}
			</div>

			{/* Desktop: table */}
			<div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-black/5 dark:ring-white/10">
				<Table className="table-glassy">
					<TableHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur dark:bg-neutral-900/50">
						<TableRow className="border-0">
							<TableHead className="min-w-[220px]">Order</TableHead>
							<TableHead>Client</TableHead>
							<TableHead className="text-right">Products</TableHead>
							<TableHead className="text-right">Total</TableHead>
							<TableHead className="text-right">Status</TableHead>
							<TableHead className="text-right">Created</TableHead>
							<TableHead className="w-12" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading && (
							<TableRow className="border-0">
								<TableCell colSpan={7} className="py-10 text-center text-sm text-neutral-500">
									Loading orders…
								</TableCell>
							</TableRow>
						)}
						{empty && (
							<TableRow className="border-0">
								<TableCell colSpan={7} className="py-10 text-center text-sm text-neutral-500">
									No orders found.
								</TableCell>
							</TableRow>
						)}
						{!loading &&
							rows?.map((o) => {
								const d = o?.__display || {};
								const created = o?.order_created_at ? new Date(o.order_created_at) : null;
								return (
									<TableRow
										key={o.order_id}
										className="row-soft last:border-0 hover:bg-black/[0.025] dark:hover:bg-white/5 transition-colors"
									>
										<TableCell>
											<div className="flex items-center gap-3">
												<div
													className="h-7 w-7 shrink-0 rounded-lg grid place-items-center text-[10px] font-semibold text-white bg-gradient-to-br from-[var(--primary-color)] to-emerald-600 ring-1 ring-black/5 dark:ring-white/10"
													aria-hidden
												>
													PO
												</div>
												<div className="min-w-0">
													<div className="truncate text-sm font-medium">{d.code}</div>
													<div className="truncate text-xs text-neutral-500">
														{o.order_id}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">{d.clientName}</div>
											<div className="text-xs text-neutral-500">{o?.client?.email || '—'}</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="text-sm">{o?.product_count ?? '—'}</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="text-sm">{currency(d.total, o?.currency)}</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-1">
												<Badge
													variant={statusBadgeVariant(o?.order_status)}
													className="glass-badge"
												>
													{o?.order_status || '—'}
												</Badge>
												<Badge
													variant={statusBadgeVariant(o?.payment_status)}
													className="glass-badge"
												>
													{o?.payment_status || '—'}
												</Badge>
											</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="text-sm">
												{created ? created.toISOString().slice(0, 10) : '—'}
											</div>
											<div className="text-xs text-neutral-500">
												{created ? created.toISOString().slice(11, 16) : ''}
											</div>
										</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 cursor-pointer"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="glass-menu">
													<DropdownMenuItem
														className="cursor-pointer"
														onClick={() => onView?.(o)}
													>
														<Eye className="mr-2 h-4 w-4" />
														View details
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
		</>
	);
};

export default OrderTable;
