import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  LayoutGrid,
  List,
  MapPin,
  Search,
  Tag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useEntityTypeGetAll } from "~/api/generated/endpoints/entity-types/entity-types";
import { useLocationTreeQuery } from "~/api/generated/endpoints/entities/entities";
import { useTagsGetAll } from "~/api/generated/endpoints/tags/tags";
import type { RepoTreeItem } from "~/api/generated/model";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { ORDER_FIELDS, type ItemsSearch } from "./list-search";

const ALL = "__all__";

function flattenTree(nodes: RepoTreeItem[] = [], depth = 0): { id: string; label: string }[] {
  return nodes.flatMap((n) => [
    { id: n.id ?? "", label: `${"  ".repeat(depth)}${n.name ?? ""}` },
    ...flattenTree(n.children, depth + 1),
  ]);
}

export type ViewMode = "list" | "grid";

type Props = {
  search: ItemsSearch;
  onChange: (patch: Partial<ItemsSearch>) => void;
  onReset: () => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
};

export function ItemsToolbar({ search, onChange, onReset, view, onViewChange }: Props) {
  const [query, setQuery] = useState(search.q ?? "");
  const tags = useTagsGetAll().data ?? [];
  const types = useEntityTypeGetAll().data ?? [];
  const tree = useLocationTreeQuery().data;
  const locations = useMemo(() => flattenTree(tree), [tree]);

  useEffect(() => setQuery(search.q ?? ""), [search.q]);
  useEffect(() => {
    if (query === (search.q ?? "")) return;
    const timer = setTimeout(() => onChange({ q: query || undefined, page: undefined }), 300);
    return () => clearTimeout(timer);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedTags = search.tags ?? [];
  const toggleTag = (id: string, on: boolean) => {
    const next = on ? [...selectedTags, id] : selectedTags.filter((t) => t !== id);
    onChange({ tags: next.length ? next : undefined, page: undefined });
  };

  const locationItems = [{ value: ALL, label: "All locations" }].concat(
    locations.map((l) => ({ value: l.id, label: l.label })),
  );
  const typeItems = [{ value: ALL, label: "All types" }].concat(
    types.map((t) => ({ value: t.id ?? "", label: t.name ?? "" })),
  );

  const activeTags = tags.filter((t) => t.id && selectedTags.includes(t.id));
  const activeLocation = locations.find((l) => l.id === search.location);
  const activeType = types.find((t) => t.id === search.type);
  const hasFilters = Boolean(search.q || selectedTags.length || search.location || search.type);
  const dir =
    search.dir ?? (search.orderBy === "name" || search.orderBy === "assetId" ? "asc" : "desc");

  return (
    <div className="space-y-3 rounded-xl border bg-card p-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search items, #asset ID, or "exact phrase"...'
          aria-label="Search items"
          className="h-9 pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            <Tag />
            Tags
            {selectedTags.length > 0 && <Badge>{selectedTags.length}</Badge>}
            <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 min-w-48 overflow-y-auto">
            {tags.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">No tags yet.</p>
            )}
            {tags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag.id}
                checked={selectedTags.includes(tag.id ?? "")}
                closeOnClick={false}
                onCheckedChange={(on) => toggleTag(tag.id ?? "", on)}
              >
                {tag.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 px-1">
          <Switch
            id="match-all"
            checked={search.matchAll ?? false}
            onCheckedChange={(v) => onChange({ matchAll: v || undefined, page: undefined })}
          />
          <Label htmlFor="match-all" className="text-sm text-muted-foreground">
            Match all
          </Label>
        </div>

        <Select
          items={locationItems}
          value={search.location ?? ALL}
          onValueChange={(v) =>
            onChange({ location: v === ALL ? undefined : (v ?? undefined), page: undefined })
          }
        >
          <SelectTrigger aria-label="Location">
            <MapPin />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locationItems.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={typeItems}
          value={search.type ?? ALL}
          onValueChange={(v) =>
            onChange({ type: v === ALL ? undefined : (v ?? undefined), page: undefined })
          }
        >
          <SelectTrigger aria-label="Entity type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeItems.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Select
            items={ORDER_FIELDS}
            value={search.orderBy ?? "updatedAt"}
            onValueChange={(v) => onChange({ orderBy: v ?? undefined, page: undefined })}
          >
            <SelectTrigger aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_FIELDS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            aria-label={dir === "asc" ? "Sort ascending" : "Sort descending"}
            onClick={() => onChange({ dir: dir === "asc" ? "desc" : "asc", page: undefined })}
          >
            {dir === "asc" ? <ArrowUp /> : <ArrowDown />}
          </Button>
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => onViewChange("list")}
            >
              <List />
            </Button>
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => onViewChange("grid")}
            >
              <LayoutGrid />
            </Button>
          </div>
        </div>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-muted-foreground uppercase">Active</span>
          {search.q && (
            <FilterChip
              label={`Search: ${search.q}`}
              onRemove={() => onChange({ q: undefined, page: undefined })}
            />
          )}
          {activeTags.map((t) => (
            <FilterChip
              key={t.id}
              label={`Tag: ${t.name}`}
              onRemove={() => toggleTag(t.id ?? "", false)}
            />
          ))}
          {activeLocation && (
            <FilterChip
              label={`Location: ${activeLocation.label.trim()}`}
              onRemove={() => onChange({ location: undefined, page: undefined })}
            />
          )}
          {activeType && (
            <FilterChip
              label={`Type: ${activeType.name}`}
              onRemove={() => onChange({ type: undefined, page: undefined })}
            />
          )}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={onReset}
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="h-6 gap-1 pr-1">
      {label}
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        className="rounded-sm hover:bg-foreground/10"
      >
        <X className="size-3" />
      </button>
    </Badge>
  );
}
