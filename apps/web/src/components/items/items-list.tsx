import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  Package,
} from "lucide-react";
import type { RepoEntitySummary } from "~/api/generated/model";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { attachmentSrc, formatNumber, formatRelative } from "./format";
import { PAGE_SIZES } from "./list-search";
import type { ViewMode } from "./items-toolbar";
import { TagBadges } from "./tag-badges";

type ListProps = {
  items: RepoEntitySummary[];
  view: ViewMode;
  selected: Set<string>;
  onToggle: (id: string, on: boolean) => void;
  onToggleAll: (on: boolean) => void;
};

function Thumb({ item, className }: { item: RepoEntitySummary; className?: string }) {
  const src = attachmentSrc(item.id ?? "", item.thumbnailId);
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground ${className ?? "size-10"}`}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <Package className="size-4" />
      )}
    </div>
  );
}

function ItemLink({ item }: { item: RepoEntitySummary }) {
  return (
    <Link
      to="/items/$itemId"
      params={{ itemId: item.id ?? "" }}
      className="font-medium hover:underline"
    >
      {item.name}
    </Link>
  );
}

export function ItemsList({ items, view, selected, onToggle, onToggleAll }: ListProps) {
  if (view === "grid") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const id = item.id ?? "";
          return (
            <div
              key={id}
              className="relative flex flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 data-[selected=true]:ring-primary"
              data-selected={selected.has(id)}
            >
              <Checkbox
                aria-label={`Select ${item.name}`}
                className="absolute top-4 left-4 z-10 bg-background"
                checked={selected.has(id)}
                onCheckedChange={(on) => onToggle(id, on)}
              />
              <Thumb item={item} className="h-32 w-full" />
              <div className="min-w-0 space-y-1">
                <ItemLink item={item} />
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {item.description || "—"}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                <TagBadges tags={item.tags} max={2} />
                <span className="text-xs text-muted-foreground">×{item.quantity ?? 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id ?? ""));
  const someSelected = items.some((i) => selected.has(i.id ?? ""));

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 pl-4">
              <Checkbox
                aria-label="Select all"
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onCheckedChange={onToggleAll}
              />
            </TableHead>
            <TableHead className="w-14">Thumb</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Entity type</TableHead>
            <TableHead>Asset ID</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="pr-4 text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const id = item.id ?? "";
            return (
              <TableRow key={id} data-state={selected.has(id) ? "selected" : undefined}>
                <TableCell className="pl-4">
                  <Checkbox
                    aria-label={`Select ${item.name}`}
                    checked={selected.has(id)}
                    onCheckedChange={(on) => onToggle(id, on)}
                  />
                </TableCell>
                <TableCell>
                  <Thumb item={item} />
                </TableCell>
                <TableCell className="max-w-72 whitespace-normal">
                  <ItemLink item={item} />
                  {item.description && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.parent?.name ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {item.parent.name}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <TagBadges tags={item.tags} />
                </TableCell>
                <TableCell>
                  {item.entityType?.name ? (
                    <Badge variant="outline">{item.entityType.name}</Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {item.assetId ? `#${item.assetId}` : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">{item.quantity ?? 1}</TableCell>
                <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                  {formatRelative(item.updatedAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function ItemsListSkeleton({ view }: { view: ViewMode }) {
  return view === "grid" ? (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-56 rounded-xl" />
      ))}
    </div>
  ) : (
    <div className="space-y-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
};

export function ItemsPagination({ page, pageSize, total, onPage, onPageSize }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const sizeItems = PAGE_SIZES.map((s) => ({ value: String(s), label: String(s) }));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>
          Showing <b className="text-foreground">{from}</b> to{" "}
          <b className="text-foreground">{to}</b> of{" "}
          <b className="text-foreground">{formatNumber(total)}</b> items
        </span>
        <span className="hidden sm:inline">Rows per page</span>
        <Select
          items={sizeItems}
          value={String(pageSize)}
          onValueChange={(v) => onPageSize(Number(v))}
        >
          <SelectTrigger size="sm" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizeItems.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="First page"
          disabled={page <= 1}
          onClick={() => onPage(1)}
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="px-2 tabular-nums">
          Page {page} of {pages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Last page"
          disabled={page >= pages}
          onClick={() => onPage(pages)}
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}
