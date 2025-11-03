import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { superadmin } from '@/api';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import ClientTable from './ClientTable';
import ClientDetailSheet from './ClientDetailSheet';
import ClientDeleteDialog from './ClientDeleteDialog';

function useDebounceLocal(value, delay = 500) {
	const [v, setV] = useState(value);
	useEffect(() => {
		const id = setTimeout(() => setV(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);
	return v;
}

const DEFAULT_ORDERING = '-created_at';
const DEFAULT_STATUS = 'all';
const PAGE_SIZE = 10;

const statuses = [
	{ value: 'all', label: 'All' },
	{ value: 'active', label: 'Active' },
	{ value: 'pending', label: 'Pending' },
];

const orderings = [
	{ value: '-created_at', label: 'Newest' },
	{ value: 'created_at', label: 'Oldest' },
	{ value: 'email', label: 'Email (A–Z)' },
	{ value: '-email', label: 'Email (Z–A)' },
	{ value: 'username', label: 'Username (A–Z)' },
	{ value: '-username', label: 'Username (Z–A)' },
];

function extractToastError(err, fallback = 'Failed to load clients.') {
	try {
		return err?.response?.data?.message || err?.response?.data?.detail || err?.message || fallback;
	} catch {
		return fallback;
	}
}

const ClientList = () => {
	const [query, setQuery] = useState('');
	const debouncedQuery = useDebounceLocal(query, 500);

	const [status, setStatus] = useState(DEFAULT_STATUS);
	const [ordering, setOrdering] = useState(DEFAULT_ORDERING);
	const [page, setPage] = useState(1);

	const [loading, setLoading] = useState(true);
	const [rows, setRows] = useState([]);
	const [count, setCount] = useState(0);
	const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

	const [detailId, setDetailId] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);

	const params = useMemo(() => {
		const p = { status, ordering, page };
		if (debouncedQuery.trim()) {
			p.q = debouncedQuery.trim(); // backend supports q/search
			p.search = debouncedQuery.trim();
		}
		return p;
	}, [debouncedQuery, status, ordering, page]);

	const fetchClients = useCallback(async () => {
		setLoading(true);
		try {
			const res = await superadmin.listClients(params);
			const payload = res?.data;

			let list = Array.isArray(payload?.results) ? payload.results : [];
			let total = typeof payload?.count === 'number' ? payload.count : 0;

			if (!list.length) {
				const maybeWrapped = payload?.data;
				if (Array.isArray(maybeWrapped?.results)) {
					list = maybeWrapped.results;
					total =
						typeof (payload?.count ?? maybeWrapped?.count) === 'number'
							? payload?.count ?? maybeWrapped?.count
							: total;
				} else if (Array.isArray(maybeWrapped)) {
					list = maybeWrapped;
					total = maybeWrapped.length;
				}
			}

			// Normalize rows to avoid duplication: merge client+user fields for display
			const merged = list.map((r) => {
				const user = r?.user || {};
				const client = r?.client || null;
				const displayName = client?.name || user?.username || user?.email || 'Client';
				const displayEmail = client?.email || user?.email || null;
				const displayPhone = client?.phone_number || user?.phone_number || null;
				return {
					...r,
					__display: { name: displayName, email: displayEmail, phone: displayPhone },
				};
			});

			setRows(merged);
			setCount(Number(total || 0));
		} catch (err) {
			toast.error(extractToastError(err));
		} finally {
			setLoading(false);
		}
	}, [params]);

	useEffect(() => {
		setPage(1);
	}, [debouncedQuery, status, ordering]);
	useEffect(() => {
		fetchClients();
	}, [fetchClients]);

	const refresh = useCallback(() => {
		fetchClients();
	}, [fetchClients]);

	return (
		<>
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.28 }}
				className="mx-auto px-4 sm:px-6"
			>
				<div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-semibold tracking-tight">
							<span className="bg-gradient-to-r from-[var(--primary-color)] to-emerald-600 bg-clip-text text-transparent">
								Clients
							</span>
						</h1>
						<p className="text-sm text-neutral-500">Manage client records and invitations.</p>
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

				<div className="glass-card flex flex-col gap-4 p-4">
					<div className="grid gap-3 md:grid-cols-3">
						<div className="col-span-2">
							<Label htmlFor="q" className="sr-only">
								Search
							</Label>
							<div className="relative">
								<Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
								<Input
									id="q"
									placeholder="Search by email, username, or phone…"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
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

					<div className="hidden md:flex items-end gap-3 rounded-2xl border border-neutral-200 bg-white/70 p-3 backdrop-blur-sm">
						<div className="min-w-[150px] flex-1">
							<Label className="text-[12px]">Status</Label>
							<Select value={status} onValueChange={(v) => setStatus(v)}>
								<SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent className="bg-white/95 backdrop-blur-md">
									{statuses.map((s) => (
										<SelectItem key={s.value} value={s.value}>
											{s.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="min-w-[180px]">
							<Label className="text-[12px]">Ordering</Label>
							<Select value={ordering} onValueChange={setOrdering}>
								<SelectTrigger className="bg-white/85 backdrop-blur-sm border-neutral-200">
									<SelectValue placeholder="Sort by…" />
								</SelectTrigger>
								<SelectContent className="bg-white/95 backdrop-blur-md">
									{orderings.map((o) => (
										<SelectItem key={o.value} value={o.value}>
											{o.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="min-w-[120px] flex items-end">
							<Button
								type="button"
								variant="ghost"
								onClick={() => {
									setQuery('');
									setStatus(DEFAULT_STATUS);
									setOrdering(DEFAULT_ORDERING);
								}}
								className="cursor-pointer text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
							>
								Reset
							</Button>
						</div>
					</div>

					<Separator className="soft-divider" />

					<ClientTable
						rows={rows}
						loading={loading}
						onView={(row) => setDetailId(row?.client_id || row?.id)}
						onDelete={(row) => setDeleteTarget(row)}
					/>

					<div className="mt-1 flex items-center justify-between">
						<div className="text-xs text-neutral-500">
							Page {page} of {Math.max(1, Math.ceil(count / PAGE_SIZE))}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1 || loading}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								className="glass-button"
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= Math.max(1, Math.ceil(count / PAGE_SIZE)) || loading}
								onClick={() =>
									setPage((p) => Math.min(Math.max(1, Math.ceil(count / PAGE_SIZE)), p + 1))
								}
								className="glass-button"
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</motion.div>

			<ClientDetailSheet
				clientId={detailId}
				open={!!detailId}
				onOpenChange={(o) => {
					if (!o) setDetailId(null);
				}}
				onDeleted={() => {
					setDetailId(null);
					fetchClients();
				}}
			/>

			<ClientDeleteDialog
				client={deleteTarget}
				open={!!deleteTarget}
				onOpenChange={(o) => {
					if (!o) setDeleteTarget(null);
				}}
				onDone={() => {
					setDeleteTarget(null);
					fetchClients();
				}}
			/>
		</>
	);
};

export default ClientList;
