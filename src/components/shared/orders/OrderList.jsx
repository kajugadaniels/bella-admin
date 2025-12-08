import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RefreshCw, Search, Filter } from "lucide-react";

import { superadmin } from "@/api";

import OrderTable from "./OrderTable";
import OrderDetailSheet from "./OrderDetailSheet";
import OrderFilters from "./OrderFilters";

function useDebounceLocal(value, delay = 500) {
	const [v, setV] = useState(value);
	useEffect(() => {
		const id = setTimeout(() => setV(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);
	return v;
}

const PAGE_SIZE = 10;
const ANY = "__any__";

const DEFAULT_FILTERS = {
	status: ANY,
	paymentStatus: ANY,
	paymentMethod: ANY,
	ordering: "-created_at",
};

function parseError(err, fallback = "Failed to load orders.") {
	return err?.response?.data?.message || err?.response?.data?.detail || err?.message || fallback;
}

const OrderList = () => {
	const [q, setQ] = useState("");
	const dq = useDebounceLocal(q, 500);

	const [filters, setFilters] = useState(DEFAULT_FILTERS);

	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [rows, setRows] = useState([]);
	const [count, setCount] = useState(0);

	const [detailId, setDetailId] = useState(null);

	const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

	const params = useMemo(() => {
		const par = { page, ordering: filters.ordering };

		if (filters.status !== ANY) par.status = filters.status;
		if (filters.paymentStatus !== ANY) par.payment_status = filters.paymentStatus;
		if (filters.paymentMethod !== ANY) par.payment_method = filters.paymentMethod;

		const s = dq.trim();
		if (s) {
			if (/^PO-\d{8}-[A-F0-9]{6}$/i.test(s)) par.code = s;
			else if (s.includes("@")) par.client_email = s;
			else {
				par.client_name = s;
				if (s.length >= 4) par.code = s;
			}
		}
		return par;
	}, [page, filters, dq]);

	const fetchOrders = useCallback(async () => {
		setLoading(true);
		try {
			const res = await superadmin.listOrders(params);
			const payload = res?.data;
			const list = Array.isArray(payload?.results) ? payload.results : [];
			const total = typeof payload?.count === "number" ? payload.count : list.length;

			const normalized = list.map((o) => {
				const client = o?.client || {};
				return {
					...o,
					__display: {
						clientName: client?.name || client?.email || "Client",
						clientEmail: client?.email,
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
	}, [dq, filters]);

	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	const refresh = () => fetchOrders();

	const MotionDiv = motion.div;
	const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

	return (
		<>
			<MotionDiv
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.28 }}
				className="mx-auto px-4 sm:px-6"
			>
				{/* Page Header */}
				<div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-semibold tracking-tight">
							<span className="bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 bg-clip-text text-transparent">
								Orders
							</span>
						</h1>
						<p className="text-sm text-neutral-500">
							Track customer orders, payments, and fulfillment.
						</p>
					</div>

					{/* Badge + Filters + Refresh */}
					<div className="flex items-center gap-3">
						{/* Filters Button */}
						<Button
							variant="outline"
							size="sm"
							onClick={() => setFiltersSheetOpen(true)}
							className="glass-button rounded-4xl px-4"
						>
							<Filter className="mr-2 h-4 w-4" />
							Filters
						</Button>

						{/* Refresh Button */}
						<Button
							variant="outline"
							size="sm"
							onClick={refresh}
							disabled={loading}
							className="glass-button rounded-4xl px-4"
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Refresh
						</Button>
					</div>
				</div>

				{/* Card */}
				<div className="glass-card flex flex-col gap-4 p-4">

					{/* Top bar: Search + Buttons */}
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						{/* Search */}
						<div className="flex-1">
							<Label htmlFor="q" className="sr-only">Search</Label>
							<div className="relative">
								<Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
								<Input
									id="q"
									placeholder="Search by code, client name, or email…"
									value={q}
									onChange={(e) => setQ(e.target.value)}
									className="glass-input pl-9"
								/>
							</div>
						</div>

						{/* Badge + Filters + Refresh */}
						<div className="flex items-center gap-3">
							<Badge variant="secondary" className="glass-badge">
								{count} total
							</Badge>
						</div>
					</div>

					<Separator className="soft-divider" />

					{/* Table */}
					<OrderTable
						rows={rows}
						loading={loading}
						onView={(row) => setDetailId(row?.order_id || row?.id)}
					/>

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
			</MotionDiv>

			{/* Filter sheet */}
			<OrderFilters
				open={filtersSheetOpen}
				onOpenChange={setFiltersSheetOpen}
				value={filters}
				onChange={setFilters}
			/>

			{/* Order Details */}
			<OrderDetailSheet
				orderId={detailId}
				open={!!detailId}
				onOpenChange={(o) => !o && setDetailId(null)}
			/>
		</>
	);
};

export default OrderList;
