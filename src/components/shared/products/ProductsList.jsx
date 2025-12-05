import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, Search, SortAsc, SortDesc, Filter } from "lucide-react";
import { toast } from "sonner";

import { superadmin } from "@/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import ProductFiltersSheet from "./ProductFiltersSheet";
import ProductTable from "./ProductTable";
import ProductCard from "./ProductCard";

import ProductCreateSheet from "./ProductCreateSheet";
import ProductDetailSheet from "./ProductDetailSheet";
import ProductUpdateSheet from "./ProductUpdateSheet";
import StockInDetailSheet from "./StockInDetailSheet";

import { DEFAULT_PRODUCT_FILTERS } from "./productFiltersConstants";

/* -------------------------------------------------------------------------- */
/*                                 Debounce                                   */
/* -------------------------------------------------------------------------- */

function useDebounceLocal(value, delay = 500) {
	const [v, setV] = useState(value);
	useEffect(() => {
		const id = setTimeout(() => setV(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);
	return v;
}

const DEFAULT_ORDERING = "-created_at";

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const ProductsList = () => {
	/* Search */
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounceLocal(query, 500);

	/* Filters */
	const [filters, setFilters] = useState({ ...DEFAULT_PRODUCT_FILTERS });
	const [filtersOpen, setFiltersOpen] = useState(false);

	/* Sorting */
	const [ordering, setOrdering] = useState(DEFAULT_ORDERING);

	/* Pagination */
	const [page, setPage] = useState(1);
	const [count, setCount] = useState(0);
	const pageSize = 10;
	const totalPages = Math.max(1, Math.ceil(count / pageSize));

	/* Data */
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(true);

	/* Publish state flags */
	const [publishBusy, setPublishBusy] = useState({});

	/* Modals */
	const [detailProductId, setDetailProductId] = useState(null);
	const [updateProductId, setUpdateProductId] = useState(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [stockInDetailId, setStockInDetailId] = useState(null);

	/* ---------------------------------------------------------------------- */
	/*                               Fetch Logic                               */
	/* ---------------------------------------------------------------------- */

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

	/* ---------------------------------------------------------------------- */
	/*                          Publish / Unpublish                           */
	/* ---------------------------------------------------------------------- */

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

	/* UI wrapper */
	const MotionDiv = motion.div;

	/* ---------------------------------------------------------------------- */
	/*                                 RENDER                                  */
	/* ---------------------------------------------------------------------- */

	return (
		<>
			<MotionDiv
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.25 }}
				className="mx-auto px-4 sm:px-6"
			>
				{/* Page Header */}
				<div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-semibold tracking-tight">
							<span className="bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 bg-clip-text text-transparent">
								Products
							</span>
						</h1>
						<p className="text-sm text-neutral-500">
							Inventory batches (StockIn) with remaining quantities & values.
						</p>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)} className="glass-button">
							<Filter className="mr-2 h-4 w-4" />
							Filters
						</Button>

						<Button variant="outline" size="sm" onClick={refresh} className="glass-button">
							<RefreshCw className="mr-2 h-4 w-4" />
							Refresh
						</Button>

						<Button size="sm" onClick={() => setCreateOpen(true)} className="glass-cta rounded-4xl px-4">
							<Plus className="mr-2 h-4 w-4" />
							New Product
						</Button>
					</div>
				</div>

				{/* Main card */}
				<div className="glass-card flex flex-col gap-4 p-4">
					{/* Search + Sort */}
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div className="relative w-full md:flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
							<Input
								placeholder="Search by product or store…"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="glass-input pl-9"
							/>
						</div>

						<div className="flex items-center gap-3">
							<Badge variant="secondary" className="glass-badge">{count} total</Badge>

							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setOrdering((prev) =>
										prev.startsWith("-") ? prev.slice(1) : `-${prev}`
									)
								}
								className="glass-button"
							>
								{ordering.startsWith("-") ? (
									<SortDesc className="mr-2 h-4 w-4" />
								) : (
									<SortAsc className="mr-2 h-4 w-4" />
								)}
								Sort
							</Button>
						</div>
					</div>

					<Separator className="soft-divider" />

					{/* TABLE (Large screens) */}
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
							[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="h-32 w-full rounded-xl" />
							))}

						{!loading && rows.length === 0 && (
							<div className="rounded-xl border bg-white/70 p-6 text-center text-neutral-500">
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
					<div className="mt-3 flex items-center justify-between text-sm">
						<span className="text-neutral-500">
							Page {page} of {totalPages}
						</span>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								className="glass-button"
							>
								Previous
							</Button>

							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								className="glass-button"
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</MotionDiv>

			{/* Filters Sheet */}
			<ProductFiltersSheet open={filtersOpen} onOpenChange={setFiltersOpen} value={filters} onChange={setFilters} />

			{/* Detail Sheet */}
			{detailProductId && (
				<ProductDetailSheet
					id={detailProductId}
					open={!!detailProductId}
					onOpenChange={(o) => !o && setDetailProductId(null)}
				/>
			)}

			{/* Update Sheet */}
			{updateProductId && (
				<ProductUpdateSheet
					id={updateProductId}
					open={!!updateProductId}
					onOpenChange={(o) => !o && setUpdateProductId(null)}
					onDone={refresh}
				/>
			)}

			{/* StockIn Detail Sheet */}
			{stockInDetailId && (
				<StockInDetailSheet
					id={stockInDetailId}
					open={!!stockInDetailId}
					onOpenChange={(o) => !o && setStockInDetailId(null)}
					onDone={refresh}
				/>
			)}

			{/* Create New Product Sheet */}
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
