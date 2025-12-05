import React from "react";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Eye, Layers, PencilLine, ListFilter, CircleAlert } from "lucide-react";

import ExpiryBadge from "./shared/ExpiryBadge";
import ProductThumb from "./shared/ProductThumb";

export default function ProductTable({
    rows,
    loading,
    publishBusy = {},
    onTogglePublish,
    onView,
    onUpdate,
    onBatch,
}) {
    return (
        <div className="hidden overflow-x-auto rounded-xl ring-1 ring-black/5 lg:block">
            <Table className="table-glassy">
                <TableHeader className="sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
                    <TableRow className="border-0">
                        <TableHead className="min-w-[260px]">Product</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-right">Discounted</TableHead>
                        <TableHead className="text-right">Original</TableHead>
                        <TableHead className="text-right">Gross Value</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Expiry</TableHead>
                        <TableHead className="text-center">Published</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {/* Skeleton Loader */}
                    {loading && (
                        <TableRow>
                            <TableCell colSpan={10} className="py-10">
                                <div className="space-y-2">
                                    {[...Array(6)].map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full rounded-md" />
                                    ))}
                                </div>
                            </TableCell>
                        </TableRow>
                    )}

                    {/* Empty state */}
                    {!loading && rows?.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={10}
                                className="py-10 text-center text-sm text-neutral-500"
                            >
                                <div className="inline-flex items-center gap-2">
                                    <CircleAlert className="h-4 w-4" />
                                    No products found.
                                </div>
                            </TableCell>
                        </TableRow>
                    )}

                    {/* Rows */}
                    {!loading &&
                        rows?.map((item) => {
                            const p = item.product || {};
                            const store = item.store;
                            const q = item.quantities || {};
                            const price = item.pricing || {};
                            const dates = item.dates || {};
                            const isPublished = !!p.published;
                            const busy = publishBusy[p.id];

                            return (
                                <TableRow
                                    key={item.id}
                                    className="hover:bg-black/[0.03] transition-colors"
                                >
                                    {/* Product Info */}
                                    <TableCell>
                                        <div className="flex min-w-0 items-center gap-3">
                                            <ProductThumb
                                                src={p.image}
                                                alt={p.name}
                                                size={42}
                                                rounded="rounded-lg"
                                            />

                                            <div className="min-w-0">
                                                <div className="truncate font-medium text-sm">
                                                    {p.name}
                                                </div>

                                                <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                                                    <Badge variant="secondary" className="glass-badge">
                                                        {p.category || "—"}
                                                    </Badge>
                                                    <span>#{p.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Store */}
                                    <TableCell>
                                        <div className="truncate">
                                            {store?.name || "Global"}
                                        </div>
                                    </TableCell>

                                    {/* Quantities */}
                                    <TableCell className="text-right">
                                        {q.remaining ?? "—"}
                                    </TableCell>

                                    {/* Discounted */}
                                    <TableCell className="text-right font-semibold text-emerald-700">
                                        {price.unit_price ?? "—"}
                                    </TableCell>

                                    {/* Original */}
                                    <TableCell className="text-right text-neutral-600 line-through decoration-red-500/70">
                                        {p.discount_price ?? "—"}
                                    </TableCell>

                                    {/* Gross */}
                                    <TableCell className="text-right">
                                        {price.value_gross ?? "—"}
                                    </TableCell>

                                    {/* Received date */}
                                    <TableCell className="text-right">
                                        {dates.received_at?.slice(0, 10) || "—"}
                                    </TableCell>

                                    {/* Expiry */}
                                    <TableCell className="text-right">
                                        <div className="truncate text-sm">
                                            {dates.expiry_date?.slice(0, 10) || "—"}
                                        </div>
                                        <ExpiryBadge expiryDate={dates.expiry_date} />
                                    </TableCell>

                                    {/* Publish toggle */}
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center gap-2">
                                            <Checkbox
                                                checked={isPublished}
                                                disabled={busy}
                                                onCheckedChange={(v) =>
                                                    onTogglePublish?.(p.id, !!v)
                                                }
                                                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                            />
                                            <span className="text-xs text-neutral-600">
                                                {isPublished ? "Published" : "Hidden"}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 cursor-pointer"
                                                >
                                                    <ListFilter className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end" className="glass-menu">
                                                <DropdownMenuItem
                                                    onClick={() => onView?.(p.id)}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" /> View product
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    onClick={() => onBatch?.(item.id)}
                                                >
                                                    <Layers className="mr-2 h-4 w-4" /> View batch
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    onClick={() => onUpdate?.(p.id)}
                                                >
                                                    <PencilLine className="mr-2 h-4 w-4" /> Edit product
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
}
