import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ClipboardCopy, Copy, ExternalLink, Mail, Phone, Shield, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { superadmin } from '@/api';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import ClientDeleteDialog from './ClientDeleteDialog';

function initials(text = '') {
	const n = (text || '').trim();
	if (!n) return 'C';
	if (n.includes('@')) return n[0].toUpperCase();
	const parts = n.split(/\s+/);
	const a = parts[0]?.[0] || 'C';
	const b = (parts[1]?.[0] || n[1] || '').toUpperCase();
	return (a + b).toUpperCase();
}

const GlassCard = ({ className = '', children }) => (
	<div
		className={[
			'rounded-2xl border p-3',
			'border-neutral-200/80 bg-white/70 backdrop-blur-md',
			className,
		].join(' ')}
	>
		{children}
	</div>
);

const InfoRow = ({ icon, label, value, href, copyable }) => {
    const Icon = icon;

    const content = (
        <div className="min-w-0 flex-1 truncate text-sm text-neutral-800">
            {value ?? "—"}
        </div>
    );

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(String(value ?? ""));
            toast.success(`${label} copied`);
        } catch {
            toast.error("Could not copy");
        }
    };

    return (
        <div className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-black/[0.03]">
            <div className="h-8 w-8 grid place-items-center rounded-lg border border-neutral-200/80 bg-white/70 text-neutral-600 backdrop-blur-sm">
                <Icon className="h-4 w-4" />
            </div>

            <div className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {label}
            </div>

            {href ? (
                <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
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

            {copyable && value ? (
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={copy}
                    className="h-8 w-8 text-neutral-500 hover:text-neutral-800"
                >
                    <Copy className="h-4 w-4" />
                </Button>
            ) : null}
        </div>
    );
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

export default function ClientDetailSheet({ clientId, open, onOpenChange, onDeleted }) {
	const [loading, setLoading] = useState(false);
	const [payload, setPayload] = useState(null);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const fetchClient = useCallback(async () => {
		if (!open || !clientId) return;
		setLoading(true);
		try {
			const res = await superadmin.getClient(clientId); // server auto-detects status
			const data = res?.data?.data || res?.data;
			setPayload(data || null);
		} catch (err) {
			const msg =
				err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'Unable to load client';
			toast.error(msg);
			setPayload(null);
		} finally {
			setLoading(false);
		}
	}, [open, clientId]);

	useEffect(() => {
		let ignore = false;
		(async () => {
			if (!open || !clientId) return;
			if (!ignore) await fetchClient();
		})();
		return () => {
			ignore = true;
		};
	}, [open, clientId, fetchClient]);

	// Prefer client values, fallback to user
	const n = payload || {};
	const memoUser = useMemo(() => user, [user]);
	const client = n.client || null;

	const displayName = client?.name || user?.username || user?.email || 'Client';
	const displayEmail = client?.email || user?.email || null;
	const displayPhone = client?.phone_number || user?.phone_number || null;

	const id = n.client_id || n.id || clientId;
	const title = displayName;

	const avatar = useMemo(() => {
		if (user?.image_url) {
			return (
				<img
					src={user.image_url}
					alt={title}
					className="h-10 w-10 rounded-xl object-cover ring-1 ring-black/5"
				/>
			);
		}
		return (
			<div
				className="grid h-10 w-10 place-items-center rounded-4xl text-sm font-semibold text-white ring-1 ring-black/5"
				style={{ background: 'linear-gradient(135deg, var(--primary-color), #059669)' }}
			>
				{initials(title)}
			</div>
		);
	}, [memoUser, title]);

	const copyId = async () => {
		try {
			await navigator.clipboard.writeText(String(id || ''));
			toast.success('Client ID copied');
		} catch {
			toast.error('Could not copy ID');
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="p-0 w-[min(980px,100vw)] sm:max-w-[980px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right border-l border-neutral-200 bg-white/90 backdrop-blur-xl"
			>
				<div
					className="h-20 w-full"
					style={{ background: 'linear-gradient(90deg, var(--primary-color), #059669)' }}
				/>
				<div className="-mt-10 px-5 sm:px-6">
					<GlassCard className="p-4">
						<SheetHeader className="mb-1">
							<SheetTitle className="sr-only">Client details</SheetTitle>
							{loading ? (
								<HeaderSkeleton />
							) : (
								<div className="flex flex-wrap items-center gap-3">
									{avatar}
									<div className="min-w-0 flex-1">
										<div className="truncate text-lg font-semibold">{title}</div>
										<SheetDescription className="truncate text-xs">{id || ''}</SheetDescription>
									</div>

									<div className="flex flex-wrap items-center gap-2">
										<Badge
											variant={(n?.status || 'active') === 'pending' ? 'secondary' : 'default'}
											className="glass-badge"
										>
											{n?.status || 'active'}
										</Badge>

										<Button
											variant="outline"
											onClick={copyId}
											className="cursor-pointer px-6 py-4 rounded-4xl"
										>
											<ClipboardCopy className="mr-2 h-4 w-4" />
											Copy ID
										</Button>

										{displayEmail && (
											<a href={`mailto:${displayEmail}`} className="contents">
												<Button
													variant="outline"
													className="cursor-pointer px-6 py-4 rounded-4xl"
												>
													<Mail className="mr-2 h-4 w-4" />
													Email
												</Button>
											</a>
										)}
										{displayPhone && (
											<a href={`tel:${displayPhone}`} className="contents">
												<Button
													variant="outline"
													className="cursor-pointer px-6 py-4 rounded-4xl"
												>
													<Phone className="mr-2 h-4 w-4" />
													Call
												</Button>
											</a>
										)}

										<Button
											variant="destructive"
											className="glass-cta-danger px-6 py-4 rounded-4xl"
											onClick={() => setConfirmDelete(true)}
										>
											Delete
										</Button>
									</div>
								</div>
							)}
						</SheetHeader>
					</GlassCard>
				</div>

				<div className="px-5 pb-6 pt-4 sm:px-6">
					<Separator className="my-4 border-neutral-200" />

					{loading ? (
						<div className="space-y-3">
							<Skeleton className="h-28 w-full rounded-xl" />
							<Skeleton className="h-28 w-full rounded-xl" />
						</div>
					) : !id ? (
						<div className="text-sm text-neutral-500">Client not found.</div>
					) : (
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{/* LEFT: Contact (merged values) */}
							<GlassCard>
								<div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
									<UserCircle2 className="h-4 w-4" />
									Profile & Contact
								</div>
								<div className="mt-2 space-y-1">
									<InfoRow
										icon={Mail}
										label="Email"
										value={displayEmail}
										href={displayEmail ? `mailto:${displayEmail}` : undefined}
										copyable
									/>
									<InfoRow icon={UserCircle2} label="Username" value={user?.username} copyable />
									<InfoRow
										icon={Phone}
										label="Phone"
										value={displayPhone}
										href={displayPhone ? `tel:${displayPhone}` : undefined}
										copyable
									/>
								</div>
							</GlassCard>

							{/* RIGHT: Meta (concise) */}
							<GlassCard>
								<div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-600">
									<Shield className="h-4 w-4" />
									Status & Meta
								</div>
								<div className="mt-2 space-y-1">
									<InfoRow icon={Shield} label="Role" value={user?.role || 'CLIENT'} copyable />
									<InfoRow icon={Shield} label="Status" value={n?.status || 'active'} />
									<InfoRow
										icon={Shield}
										label="Created at"
										value={
											n?.created_at
												? new Date(n.created_at).toLocaleString()
												: user?.created_at
												? new Date(user.created_at).toLocaleString()
												: '—'
										}
									/>
								</div>
							</GlassCard>
						</div>
					)}
				</div>

				<ClientDeleteDialog
					client={payload}
					open={confirmDelete}
					onOpenChange={setConfirmDelete}
					onDone={() => {
						setConfirmDelete(false);
						onOpenChange?.(false);
						onDeleted?.();
					}}
				/>
			</SheetContent>
		</Sheet>
	);
}
