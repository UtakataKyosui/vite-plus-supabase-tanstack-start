export type ItemsSearch = {
  q?: string;
  page?: number;
  pageSize?: number;
  tags?: string[];
  matchAll?: boolean;
  location?: string;
  type?: string;
  orderBy?: string;
  dir?: "asc" | "desc";
};

export const PAGE_SIZES = [10, 25, 50, 100];
export const ORDER_FIELDS = [
  { value: "updatedAt", label: "Updated at" },
  { value: "createdAt", label: "Created at" },
  { value: "name", label: "Name" },
  { value: "assetId", label: "Asset ID" },
];

export function validateItemsSearch(raw: Record<string, unknown>): ItemsSearch {
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : undefined;
  };
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === "string")
    : undefined;
  return {
    q: str(raw.q),
    page: num(raw.page),
    pageSize: PAGE_SIZES.includes(Number(raw.pageSize)) ? Number(raw.pageSize) : undefined,
    tags: tags?.length ? tags : undefined,
    matchAll: raw.matchAll === true || raw.matchAll === "true" ? true : undefined,
    location: str(raw.location),
    type: str(raw.type),
    orderBy: ORDER_FIELDS.some((f) => f.value === raw.orderBy)
      ? (raw.orderBy as string)
      : undefined,
    dir: raw.dir === "asc" || raw.dir === "desc" ? raw.dir : undefined,
  };
}
