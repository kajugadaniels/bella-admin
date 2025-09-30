// src/components/shared/orders/OrderList.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { RefreshCw, Search } from 'lucide-react';
import { superadmin } from '@/api';
import OrderTable from './OrderTable';
import OrderDetailSheet from './OrderDetailSheet';

function useDebounceLocal(value, delay = 500) {
	const [v, setV] = useState(value);
	useEffect(() => {
		const id = setTimeout(() => setV(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);
	return v;
}

const PAGE_SIZE = 10;
const DEFAULT_ORDERING = '-created_at';
const ANY = '__any__'; // sentinel to represent "no filter"

// Use sentinel values instead of empty string
const statusOptions = [
	{ value: ANY, label: 'Any status' },
	{ value: 'DRAFT', label: 'Draft' },
	{ value: 'PENDING', label: 'Pending' },
	{ value: 'CONFIRMED', label: 'Confirmed' },
	{ value: 'PAID', label: 'Paid' },
	{ value: 'FULFILLED', label: 'Fulfilled' },
	{ value: 'CANCELLED', label: 'Cancelled' },
	{ value: 'REFUNDED', label: 'Refunded' },
];

const pStatusOptions = [
	{ value: ANY, label: 'Any payment' },
	{ value: 'PENDING', label: 'Payment Pending' },
	{ value: 'PAID', label: 'Payment Paid' },
	{ value: 'FAILED', label: 'Payment Failed' },
	{ value: 'REFUNDED', label: 'Payment Refunded' },
];

const pMethodOptions = [
	{ value: ANY, label: 'Any method' },
	{ value: 'CASH', label: 'Cash' },
	{ value: 'MOMO', label: 'Mobile Money' },
	{ value: 'CARD', label: 'Card' },
	{ value: 'OTHER', label: 'Other' },
];

const orderingOptions = [
	{ value: '-created_at', label: 'Newest' },
	{ value: 'created_at', label: 'Oldest' },
	{ value: 'grand_total', label: 'Total (low→high)' },
	{ value: '-grand_total', label: 'Total (high→low)' },
	{ value: 'status', label: 'Status (A–Z)' },
	{ value: '-status', label: 'Status (Z–A)' },
];

function parseError(err, fallback = 'Failed to load orders.') {
	return err?.response?.data?.message || err?.response?.data?.detail || err?.message || fallback;
}

const OrderList = () => {
	const [q, setQ] = useState('');
	const dq = useDebounceLocal(q, 500);

	// FIX: initialize with sentinel
	const [status, setStatus] = useState(ANY);
	const [paymentStatus, setPaymentStatus] = useState(ANY);
	const [paymentMethod, setPaymentMethod] = useState(ANY);
	const [ordering, setOrdering] = useState(DEFAULT_ORDERING);

	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [rows, setRows] = useState([]);
	const [count, setCount] = useState(0);
	const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
	const [detailId, setDetailId] = useState(null);

	const params = useMemo(() => {
		const par = { page, ordering };

		// Only include filter params if not the ANY sentinel
		if (status !== ANY) par.status = status;
		if (paymentStatus !== ANY) par.payment_status = paymentStatus;
		if (paymentMethod !== ANY) par.payment_method = paymentMethod;

		const s = dq.trim();
		if (s) {
			if (/^PO-\d{8}-[A-F0-9]{6}$/i.test(s)) par.code = s;
			else if (s.includes('@')) par.client_email = s;
			else {
				par.client_name = s;
				if (s.length >= 4) par.code = s;
			}
		}
		return par;
	}, [page, ordering, status, paymentStatus, paymentMethod, dq]);

	const fetchOrders = useCallback(async () => {
		setLoading(true);
		try {
			const res = await superadmin.listOrders(params);
			const payload = res?.data;
			const list = Array.isArray(payload?.results) ? payload.results : [];
			const total = typeof payload?.count === 'number' ? payload.count : list.length;

			const normalized = list.map((o) => {
				const client = o?.client || {};
				return {
					...o,
					__display: {
						clientName: client?.name || client?.email || 'Client',
						clientEmail: client?.email || null,
						total: o?.order_grand_total ?? null,
						code: o?.order_code,
					},
				};
			});

			setRows(normalized);
			setCount(total);
		} catch (err) {
			toast.error(parseError(err));
		} finally {
			setLoading(false);
		}
	}, [params]);

	useEffect(() => {
		setPage(1);
	}, [dq, status, paymentStatus, paymentMethod, ordering]);
	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	const refresh = () => fetchOrders();

	return (
		<>
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.28 }}
				className="mx-auto px-4 sm:px-6"
			>
				{/* Header */}
				<div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-semibold tracking-tight">
							<span className="bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 bg-clip-text text-transparent">
								Orders
							</span>
						</h1>
						<p className="text-sm text-neutral-500">Track customer orders, payments, and fulfillment.</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={refresh}
							className="glass-button rounded-4xl px-4 py-5"
							disabled={loading}
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Refresh
						</Button>
					</div>
				</div>

				{/* Card */}
				<div className="glass-card flex flex-col gap-4 p-4">
					{/* Top row: Search + count */}
					<div className="grid gap-3 md:grid-cols-3">
						<div className="col-span-2">
							<Label htmlFor="q" className="sr-only">
								Search
							</Label>
							<div className="relative">
								<Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
								<Input
									id="q"
									placeholder="Search by code (PO-YYYYMMDD-XXXXXX), client name, or email…"
									value={q}
									onChange={(e) => setQ(e.target.value)}
									className="glass-input pl-9"
								/>
							</div>
						</div>
						<div className="flex items-center">
							<Badge variant="secondary" className="ml-auto glass-badge">
								{count} total
							</Badge>
						</div>
					</div>

					{/* Filters */}
					<div className="hidden md:grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl border border-neutral-200 bg-white/70 p-3 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/60">
						<div>
							<Label className="text-[12px]">Order status</Label>
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
									{statusOptions.map((o) => (
										<SelectItem key={o.value} value={o.value}>
											{o.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-[12px]">Payment status</Label>
							<Select value={paymentStatus} onValueChange={setPaymentStatus}>
								<SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
									{pStatusOptions.map((o) => (
										<SelectItem key={o.value} value={o.value}>
											{o.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-[12px]">Payment method</Label>
							<Select value={paymentMethod} onValueChange={setPaymentMethod}>
								<SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
									{pMethodOptions.map((o) => (
										<SelectItem key={o.value} value={o.value}>
											{o.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-[12px]">Ordering</Label>
							<Select value={ordering} onValueChange={setOrdering}>
								<SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800">
									<SelectValue placeholder="Sort by…" />
								</SelectTrigger>
								<SelectContent className="bg-white/95 backdrop-blur-md dark:bg-neutral-900/90">
									{orderingOptions.map((o) => (
										<SelectItem key={o.value} value={o.value}>
											{o.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<Separator className="soft-divider" />

					{/* Table */}
					<OrderTable rows={rows} loading={loading} onView={(row) => setDetailId(row?.order_id || row?.id)} />

					{/* Pagination */}
					<div className="mt-1 flex items-center justify-between">
						<div className="text-xs text-neutral-500">
							Page {page} of {totalPages}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="glass-button"
								disabled={page <= 1 || loading}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="glass-button"
								disabled={page >= totalPages || loading}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Detail drawer */}
			<OrderDetailSheet
				orderId={detailId}
				open={!!detailId}
				onOpenChange={(o) => {
					if (!o) setDetailId(null);
				}}
			/>
		</>
	);
};

export default OrderList;
