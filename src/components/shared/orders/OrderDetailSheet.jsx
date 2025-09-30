import React, { useCallback, useEffect, useState } from 'react';
import { superadmin } from '@/api';
import { toast } from 'sonner';
import {
	ClipboardCopy,
	ExternalLink,
	ShoppingBasket,
	BadgeCheck,
	CreditCard,
	Truck,
	UserCircle2,
	ReceiptText,
} from 'lucide-react';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function currency(amount, ccy) {
	if (amount === null || amount === undefined) return '—';
	const n = Number(amount);
	if (Number.isNaN(n)) return `${amount} ${ccy || ''}`.trim();
	return `${n.toLocaleString()}${ccy ? ` ${ccy}` : ''}`;
}

const GlassCard = ({ className = '', children }) => (
	<div
		className={[
			'rounded-2xl border p-3',
			'border-neutral-200/80 bg-white/70 backdrop-blur-md',
			'dark:border-neutral-800 dark:bg-neutral-900/60',
			className,
		].join(' ')}
	>
		{children}
	</div>
);

const Row = ({ label, value, href }) => {
	const content = (
		<div className="min-w-0 flex-1 truncate text-sm text-neutral-800 dark:text-neutral-200">{value ?? '—'}</div>
	);
	return (
		<div className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5">
			<div className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
			{href ? (
				<a
					href={href}
					target={href.startsWith('http') ? '_blank' : undefined}
					rel="noreferrer"
					className="flex-1 min-w-0"
				>
					<div className="group flex items-center gap-2">
						{content}
						<ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
					</div>
				</a>
			) : (
				content
			)}
		</div>
	);
};

const ItemRow = ({ it, ccy }) => {
	return (
		<div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-black/[0.03] dark:hover:bg-white/5">
			<div className="min-w-0">
				<div className="truncate text-sm font-medium">{it?.name_snapshot || 'Product'}</div>
				<div className="truncate text-xs text-neutral-500">{it?.product_id}</div>
				<div className="mt-1 text-xs text-neutral-500">
					Qty {it?.quantity ?? '—'} • Unit {currency(it?.unit_price_snapshot, ccy)}
				</div>
			</div>
			<div className="text-right text-sm font-medium">{currency(it?.value_gross, ccy)}</div>
		</div>
	);
};

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

const HeaderSkeleton = () => (
	<div className="flex items-center gap-3">
		<Skeleton className="h-14 w-14 rounded-xl" />
		<div className="min-w-0 flex-1 space-y-2">
			<Skeleton className="h-5 w-1/2" />
			<Skeleton className="h-3 w-1/3" />
		</div>
		<Skeleton className="h-9 w-28 rounded-xl" />
	</div>
);

export default function OrderDetailSheet({ orderId, open, onOpenChange }) {
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState(null);

	const fetchDetail = useCallback(async () => {
		if (!open || !orderId) return;
		setLoading(true);
		try {
			const res = await superadmin.getOrderDetail(orderId);
			setData(res?.data || null);
		} catch (err) {
			toast.error(
				err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'Unable to load order'
			);
			setData(null);
		} finally {
			setLoading(false);
		}
	}, [open, orderId]);

	useEffect(() => {
		let ignore = false;
		(async () => {
			if (!open || !orderId) return;
			if (!ignore) await fetchDetail();
		})();
		return () => {
			ignore = true;
		};
	}, [open, orderId, fetchDetail]);

	const o = data || {};
	const c = o?.client || {};
	const items = Array.isArray(o?.items) ? o.items : [];
	const title = o?.code || 'Order';
	const code = o?.code || o?.id || orderId;

	const created = o?.created_at ? new Date(o.created_at) : null;

	const copyCode = async () => {
		try {
			await navigator.clipboard.writeText(String(code || ''));
			toast.success('Order code copied');
		} catch {
			toast.error('Could not copy code');
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="p-0 w-[min(1024px,100vw)] sm:max-w-[1024px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right border-l border-neutral-200 bg-white/90 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/85"
			>
				{/* Top gradient */}
				<div
					className="h-20 w-full"
					style={{ background: 'linear-gradient(90deg, var(--primary-color), #059669)' }}
				/>

				{/* Header */}
				<div className="-mt-10 px-5 sm:px-6">
					<GlassCard className="p-4">
						<SheetHeader className="mb-1">
							<SheetTitle className="sr-only">Order details</SheetTitle>
							{loading ? (
								<HeaderSkeleton />
							) : (
								<div className="flex flex-wrap items-center gap-3">
									<div
										className="grid h-14 w-14 place-items-center rounded-xl text-sm font-semibold text-white ring-1 ring-black/5 dark:ring-white/10"
										style={{ background: 'linear-gradient(135deg, var(--primary-color), #059669)' }}
									>
										PO
									</div>
									<div className="min-w-0 flex-1">
										<div className="truncate text-xl font-semibold">{title}</div>
										<SheetDescription className="truncate text-xs">{o?.id || ''}</SheetDescription>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<Badge variant={statusBadgeVariant(o?.status)} className="glass-badge">
											{o?.status || '—'}
										</Badge>
										<Badge variant={statusBadgeVariant(o?.payment_status)} className="glass-badge">
											{o?.payment_status || '—'}
										</Badge>
										<Button
											variant="outline"
											onClick={copyCode}
											className="cursor-pointer px-6 py-4 rounded-4xl"
										>
											<ClipboardCopy className="mr-2 h-4 w-4" />
											Copy
										</Button>
									</div>
								</div>
							)}
						</SheetHeader>
					</GlassCard>
				</div>

				{/* Body */}
				<div className="px-5 pb-6 pt-4 sm:px-6">
					<Separator className="my-4 border-neutral-200 dark:border-neutral-800" />

					{loading ? (
						<div className="space-y-3">
							<Skeleton className="h-28 w-full rounded-xl" />
							<Skeleton className="h-28 w-full rounded-xl" />
							<Skeleton className="h-64 w-full rounded-xl" />
						</div>
					) : !o?.id ? (
						<div className="text-sm text-neutral-500">Order not found.</div>
					) : (
						<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
							{/* Left column */}
							<div className="space-y-4 xl:col-span-2">
								{/* Items */}
								<GlassCard>
									<div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
										<ShoppingBasket className="h-4 w-4" />
										Items ({items.length})
									</div>
									<div className="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800">
										{items.length === 0 ? (
											<div className="px-3 py-6 text-sm text-neutral-500">No items.</div>
										) : (
											items.map((it) => <ItemRow key={it.id} it={it} ccy={o?.currency} />)
										)}
									</div>
								</GlassCard>

								{/* Shipping & Contact */}
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<GlassCard>
										<div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
											<UserCircle2 className="h-4 w-4" />
											Customer
										</div>
										<div className="mt-2 space-y-1">
											<Row label="Name" value={o?.contact_name || c?.name} />
											<Row
												label="Email"
												value={o?.contact_email || c?.email}
												href={
													o?.contact_email || c?.email
														? `mailto:${o?.contact_email || c?.email}`
														: undefined
												}
											/>
											<Row
												label="Phone"
												value={o?.contact_phone}
												href={o?.contact_phone ? `tel:${o.contact_phone}` : undefined}
											/>
										</div>
									</GlassCard>

									<GlassCard>
										<div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
											<Truck className="h-4 w-4" />
											Shipping
										</div>
										<div className="mt-2 space-y-1">
											<Row label="Method" value={o?.shipping_method} />
											<Row label="Tracking" value={o?.shipping_tracking_code} />
											<Row
												label="ETA"
												value={
													o?.shipping_eta ? new Date(o.shipping_eta).toLocaleString() : '—'
												}
											/>
											<Row
												label="Address"
												value={
													[
														o?.address_line1,
														o?.address_line2,
														o?.village,
														o?.cell,
														o?.sector,
														o?.district,
														o?.province,
													]
														.filter(Boolean)
														.join(', ') || '—'
												}
											/>
										</div>
									</GlassCard>
								</div>
							</div>

							{/* Right column */}
							<div className="space-y-4">
								{/* Totals */}
								<GlassCard>
									<div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
										<ReceiptText className="h-4 w-4" />
										Amounts
									</div>
									<div className="mt-2 space-y-1">
										<Row label="Currency" value={o?.currency} />
										<Row label="Subtotal" value={currency(o?.subtotal, o?.currency)} />
										<Row label="Tax" value={currency(o?.tax_total, o?.currency)} />
										<Row label="Shipping" value={currency(o?.shipping_total, o?.currency)} />
										<Row label="Discount" value={currency(o?.discount_total, o?.currency)} />
										<Row label="Grand total" value={currency(o?.grand_total, o?.currency)} />
									</div>
								</GlassCard>

								{/* Payment & Status */}
								<GlassCard>
									<div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
										<CreditCard className="h-4 w-4" />
										Payment & Status
									</div>
									<div className="mt-2 space-y-1">
										<Row label="Order status" value={o?.status} />
										<Row label="Payment status" value={o?.payment_status} />
										<Row label="Method" value={o?.payment_method} />
										<Row label="Reference" value={o?.payment_reference} />
										<Row
											label="Confirmed"
											value={o?.confirmed_at ? new Date(o.confirmed_at).toLocaleString() : '—'}
										/>
										<Row
											label="Paid"
											value={o?.paid_at ? new Date(o.paid_at).toLocaleString() : '—'}
										/>
										<Row
											label="Fulfilled"
											value={o?.fulfilled_at ? new Date(o.fulfilled_at).toLocaleString() : '—'}
										/>
										<Row
											label="Cancelled"
											value={o?.cancelled_at ? new Date(o.cancelled_at).toLocaleString() : '—'}
										/>
										<Row label="Stock deducted" value={o?.stock_deducted ? 'Yes' : 'No'} />
										<Row
											label="Deducted at"
											value={o?.deducted_at ? new Date(o.deducted_at).toLocaleString() : '—'}
										/>
									</div>
								</GlassCard>

								{/* Meta */}
								<GlassCard>
									<div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
										<BadgeCheck className="h-4 w-4" />
										Meta
									</div>
									<div className="mt-2 space-y-1">
										<Row label="Code" value={o?.code} />
										<Row label="Created" value={created ? created.toLocaleString() : '—'} />
										<Row label="Notes" value={o?.notes || '—'} />
									</div>
								</GlassCard>
							</div>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
