import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, Search, SortAsc, SortDesc } from "lucide-react";
import { toast } from "sonner";

import { superadmin } from "@/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

import ProductFiltersSheet from "./ProductFiltersSheet";
import ProductTable from "./ProductTable";
import ProductCreateSheet from "./ProductCreateSheet";
import ProductDetailSheet from "./ProductDetailSheet";
import ProductUpdateSheet from "./ProductUpdateSheet";
import StockInDetailSheet from "./StockInDetailSheet";

import { DEFAULT_PRODUCT_FILTERS } from "./productFiltersConstants";

/* Debounce */
function useDebounceLocal(value, delay = 500) {
	const [v, setV] = useState(value);
	useEffect(() => {
		const id = setTimeout(() => setV(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);
	return v;
}

/* Small helpers */
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
function daysUntil(dateStr) {
	if (!dateStr) return null;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const target = new Date(dateStr);
	target.setHours(0, 0, 0, 0);
	return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}
function ExpiryBadge({ expiryDate }) {
	const d = daysUntil(expiryDate);
	if (d === null) return null;

	let cls = "border text-xs px-2.5 py-0.5 rounded-full";
	let text = "";

	if (d <= 0) {
		cls += " bg-red-100 text-red-700 border-red-200";
		text = d === 0 ? "Today" : "Expired";
	} else if (d <= 2) {
		cls += " bg-red-100 text-red-700 border-red-200";
		text = `${d}d left`;
	} else if (d <= 7) {
		cls += " bg-amber-100 text-amber-700 border-amber-200";
		text = `${d}d left`;
	} else {
		cls += " bg-emerald-100 text-emerald-700 border-emerald-200";
		text = `${d}d left`;
	}

	return <span className={cls}>{text}</span>;
}

/* Mobile Card (unchanged) */
function SvgNotFound() {
	return (
		<svg viewBox="0 0 120 120" className="h-full w-full" aria-label="Image not found">
			<rect width="120" height="120" fill="rgba(0,0,0,0.05)" />
		</svg>
	);
}
function ProductThumb({ src, alt, size = 44 }) {
	const [loaded, setLoaded] = useState(false);
	const [failed, setFailed] = useState(false);
	const showImg = !!src && !failed;

	return (
		<div
			className="relative shrink-0 overflow-hidden rounded-xl border border-black/5 bg-white/70"
			style={{ width: size, height: size }}
		>
			{showImg && (
				<img
					src={src}
					alt={alt}
					className="h-full w-full object-cover"
					onLoad={() => setLoaded(true)}
					onError={() => setFailed(true)}
				/>
			)}

			{!showImg && <SvgNotFound />}

			{showImg && !loaded && (
				<div className="absolute inset-0">
					<Skeleton className="h-full w-full" />
				</div>
			)}
		</div>
	);
}
function ProductCard({ row, publishBusy, onTogglePublish, onView, onEdit, onBatch }) {
	const p = row.product || {};
	const store = row.store;
	const q = row.quantities || {};
	const v = row.pricing || {};
	const d = row.dates || {};

	const busy = !!publishBusy?.[p.id];

	return (
		<div className="rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur-md">
			<div className="flex justify-between gap-3">
				<div className="flex items-center gap-3 min-w-0">
					<ProductThumb src={p.image} alt={p.name} />
					<div className="min-w-0">
						<div className="truncate font-medium">{p.name}</div>
						{p.discount_rate > 0 && (
							<Badge className="bg-amber-100 text-amber-700">-{fmtNum(p.discount_rate)}%</Badge>
						)}
					</div>
				</div>

				<Checkbox
					checked={!!p.published}
					disabled={busy}
					onCheckedChange={(v) => onTogglePublish(p.id, !!v)}
				/>
			</div>

			<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
				<div className="rounded-xl border p-2">Remaining: {fmtNum(q.remaining)}</div>
				<div className="rounded-xl border p-2">Received: {fmtNum(q.received)}</div>
				<div className="rounded-xl border p-2 text-emerald-700">Disc: {fmtNum(v.unit_price)}</div>
				<div className="rounded-xl border p-2 line-through">{fmtNum(p.discount_price)}</div>
				<div className="col-span-2 rounded-xl border p-2 text-amber-600">
					Discount: {fmtNum(p.discount_rate)}%
				</div>
			</div>

			<div className="mt-3 flex justify-end gap-2">
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
}

const DEFAULT_ORDERING = "-created_at";

const ProductsList = () => {
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounceLocal(query, 500);

	const [filters, setFilters] = useState({ ...DEFAULT_PRODUCT_FILTERS });
	const [ordering, setOrdering] = useState(DEFAULT_ORDERING);
	const [page, setPage] = useState(1);

	const [loading, setLoading] = useState(true);
	const [rows, setRows] = useState([]);
	const [count, setCount] = useState(0);
	const pageSize = 10;
	const totalPages = Math.max(1, Math.ceil(count / pageSize));

	const [publishBusy, setPublishBusy] = useState({});

	const [detailProductId, setDetailProductId] = useState(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [updateProductId, setUpdateProductId] = useState(null);
	const [stockInDetailId, setStockInDetailId] = useState(null);

	const [filtersOpen, setFiltersOpen] = useState(false);

	/* Fetch products */
	const fetchProducts = useCallback(async () => {
		setLoading(true);

		try {
			const params = {};

			if (debouncedQuery.trim()) params.search = debouncedQuery.trim();

			Object.entries(filters).forEach(([k, v]) => {
				if (v !== "" && v !== null && v !== undefined) params[k] = v;
			});

			params.ordering = ordering;
			params.page = page;

			const { data } = await superadmin.listProductsViaStockIn(params);
			setRows(data?.results || []);
			setCount(Number(data?.count || 0));
		} catch (err) {
			toast.error(err?.message || "Failed to load products.");
		} finally {
			setLoading(false);
		}
	}, [debouncedQuery, filters, ordering, page]);

	useEffect(() => setPage(1), [debouncedQuery, filters, ordering]);
	useEffect(() => fetchProducts(), [fetchProducts]);

	const refresh = () => fetchProducts();

	/* Publish toggle */
	const handlePublishToggle = async (productId, next) => {
		setRows((prev) =>
			prev.map((r) =>
				r.product?.id === productId
					? { ...r, product: { ...r.product, published: next } }
					: r
			)
		);

		setPublishBusy((m) => ({ ...m, [productId]: true }));

		try {
			await superadmin.publishProduct(productId);
		} catch {
			setRows((prev) =>
				prev.map((r) =>
					r.product?.id === productId
						? { ...r, product: { ...r.product, published: !next } }
						: r
				)
			);
			toast.error("Failed to update publish status.");
		}

		setPublishBusy((m) => {
			const copy = { ...m };
			delete copy[productId];
			return copy;
		});
	};

	const MotionDiv = motion.div;

	return (
		<>
			<MotionDiv
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.25 }}
				className="mx-auto px-4 sm:px-6"
			>
				{/* Header */}
				<div className="mb-4 mt-4 flex justify-between items-center">
					<div>
						<h1 className="text-xl font-semibold">
							<span className="bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 bg-clip-text text-transparent">
								Products
							</span>
						</h1>
						<p className="text-sm text-neutral-500">Track inventory batches and stock.</p>
					</div>

					<div className="flex gap-2 items-center">
						<Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
							Filters
						</Button>
						<Button variant="outline" size="sm" onClick={refresh}>
							<RefreshCw className="h-4 w-4 mr-2" />
							Refresh
						</Button>
						<Button size="sm" className="glass-cta" onClick={() => setCreateOpen(true)}>
							<Plus className="h-4 w-4 mr-2" />
							New Product
						</Button>
					</div>
				</div>

				{/* Card */}
				<div className="glass-card p-4 flex flex-col gap-4">
					{/* Search + Sort */}
					<div className="flex justify-between items-center gap-3 flex-col md:flex-row">
						<div className="relative w-full md:flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
							<Input
								placeholder="Search products…"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="glass-input pl-9"
							/>
						</div>

						<div className="flex items-center gap-3">
							<Badge variant="secondary" className="glass-badge">
								{count} total
							</Badge>

							<Button
								variant="outline"
								size="sm"
								onClick={() => setOrdering((prev) => (prev.startsWith("-") ? prev.slice(1) : `-${prev}`))}
							>
								{ordering.startsWith("-") ? <SortDesc className="h-4 w-4 mr-2" /> : <SortAsc className="h-4 w-4 mr-2" />}
								Sort
							</Button>
						</div>
					</div>

					<Separator />

					{/* DESKTOP TABLE */}
					<ProductTable
						rows={rows}
						loading={loading}
						publishBusy={publishBusy}
						onTogglePublish={handlePublishToggle}
						onView={(id) => setDetailProductId(id)}
						onEdit={(id) => setUpdateProductId(id)}
						onBatch={(sid) => setStockInDetailId(sid)}
					/>

					{/* MOBILE CARDS */}
					<div className="grid gap-3 lg:hidden">
						{loading &&
							[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}

						{!loading && rows.length === 0 && (
							<div className="rounded-xl p-4 text-center text-neutral-500">
								No products found.
							</div>
						)}

						{!loading &&
							rows.map((row) => (
								<ProductCard
									key={row.id}
									row={row}
									publishBusy={publishBusy}
									onTogglePublish={handlePublishToggle}
									onView={(id) => setDetailProductId(id)}
									onEdit={(id) => setUpdateProductId(id)}
									onBatch={(sid) => setStockInDetailId(sid)}
								/>
							))}
					</div>

					{/* Pagination */}
					<div className="mt-3 flex justify-between items-center text-sm">
						<span className="text-neutral-500">
							Page {page} of {totalPages}
						</span>

						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
							>
								Previous
							</Button>

							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</MotionDiv>

			{/* FILTER SHEET */}
			<ProductFiltersSheet
				open={filtersOpen}
				onOpenChange={setFiltersOpen}
				value={filters}
				onChange={setFilters}
			/>

			{/* DETAILS */}
			{detailProductId && (
				<ProductDetailSheet
					id={detailProductId}
					open={!!detailProductId}
					onOpenChange={(o) => !o && setDetailProductId(null)}
				/>
			)}

			{/* UPDATE */}
			{updateProductId && (
				<ProductUpdateSheet
					id={updateProductId}
					open={!!updateProductId}
					onOpenChange={(o) => !o && setUpdateProductId(null)}
					onDone={refresh}
				/>
			)}

			{/* STOCKIN BATCH */}
			{stockInDetailId && (
				<StockInDetailSheet
					id={stockInDetailId}
					open={!!stockInDetailId}
					onOpenChange={(o) => !o && setStockInDetailId(null)}
					onDone={refresh}
				/>
			)}

			{/* CREATE */}
			<ProductCreateSheet
				open={createOpen}
				onOpenChange={setCreateOpen}
				onDone={() => {
					setCreateOpen(false);
					refresh();
				}}
			/>
		</>
	);
};

export default ProductsList;
