import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import type { ReactNode } from "react";
import { useMaintenanceLogGet } from "~/api/generated/endpoints/item-maintenance/item-maintenance";
import type { RepoEntityOut } from "~/api/generated/model";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { attachmentSrc, formatCurrency, formatDate, formatRelative } from "./format";
import { MaintenancePanel } from "./maintenance-panel";
import { EmptyState } from "./query-state";
import { TagBadges } from "./tag-badges";

const hasDate = (v?: string) => Boolean(v) && new Date(v as string).getFullYear() > 1;

function Tile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-semibold">{value}</p>
      {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SpecRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono" : "font-medium"}>{value || "—"}</dd>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

function warranty(item: RepoEntityOut) {
  if (item.lifetimeWarranty) return { label: "Lifetime warranty", active: true };
  if (!hasDate(item.warrantyExpires)) return null;
  const days = Math.ceil(
    (new Date(item.warrantyExpires as string).getTime() - Date.now()) / 86_400_000,
  );
  return days >= 0
    ? {
        label: `${days} days remaining (expires ${formatDate(item.warrantyExpires)})`,
        active: true,
      }
    : { label: `Expired ${formatDate(item.warrantyExpires)}`, active: false };
}

function DetailsTab({ item }: { item: RepoEntityOut }) {
  const w = warranty(item);
  const fields = item.fields ?? [];
  const fieldValue = (f: NonNullable<RepoEntityOut["fields"]>[number]) =>
    f.type === "boolean"
      ? f.booleanValue
        ? "Yes"
        : "No"
      : f.type === "number"
        ? String(f.numberValue ?? "")
        : f.textValue;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="Purchase price"
          value={formatCurrency(item.purchasePrice)}
          sub={`Total ${formatCurrency(item.totalPrice)}`}
        />
        <Tile
          label="Purchase date"
          value={hasDate(item.purchaseDate) ? formatDate(item.purchaseDate) : "—"}
          sub={hasDate(item.purchaseDate) ? formatRelative(item.purchaseDate) : undefined}
        />
        <Tile label="Vendor / source" value={item.purchaseFrom || "—"} />
        <Tile label="Quantity" value={item.quantity ?? 1} />
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle>Hardware specifications</SectionTitle>
          {w && (
            <Badge variant={w.active ? "secondary" : "destructive"}>
              {w.active ? "Warranty active" : "Warranty expired"}
            </Badge>
          )}
        </div>
        <dl className="divide-y rounded-lg border px-3">
          <SpecRow label="Manufacturer" value={item.manufacturer} />
          <SpecRow label="Model number" value={item.modelNumber} mono />
          <SpecRow label="Serial number" value={item.serialNumber} mono />
          <SpecRow label="Warranty" value={w?.label} />
          {item.warrantyDetails && <SpecRow label="Claim terms" value={item.warrantyDetails} />}
        </dl>
      </section>

      <section>
        <SectionTitle>Description & notes</SectionTitle>
        <div className="space-y-2 rounded-lg border p-3 text-sm">
          {item.description || item.notes ? (
            <>
              {item.description && <p className="whitespace-pre-wrap">{item.description}</p>}
              {item.notes && (
                <p className="rounded-md bg-muted/50 p-2.5 whitespace-pre-wrap text-muted-foreground">
                  {item.notes}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No description or notes.</p>
          )}
        </div>
      </section>

      <section>
        <SectionTitle>Custom attributes</SectionTitle>
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">No custom attributes.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {fields.map((f) => (
              <Tile key={f.id ?? f.name} label={f.name ?? ""} value={fieldValue(f) || "—"} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ChildrenTab({ item }: { item: RepoEntityOut }) {
  const children = item.children ?? [];
  if (children.length === 0) {
    return (
      <EmptyState
        icon={<Package />}
        title="No child items"
        description="Items stored inside this one will appear here."
      />
    );
  }
  return (
    <ul className="space-y-2">
      {children.map((child) => {
        const src = attachmentSrc(child.id ?? "", child.thumbnailId);
        return (
          <li key={child.id}>
            <Link
              to="/items/$itemId"
              params={{ itemId: child.id ?? "" }}
              className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-muted/50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
                {src ? (
                  <img src={src} alt="" className="size-full object-cover" loading="lazy" />
                ) : (
                  <Package className="size-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{child.name}</p>
                <TagBadges tags={child.tags} max={2} />
              </div>
              <span className="text-xs text-muted-foreground">×{child.quantity ?? 1}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ItemDetailsTabs({ item }: { item: RepoEntityOut }) {
  const itemId = item.id ?? "";
  const maintenanceCount = useMaintenanceLogGet(itemId, { status: "both" }).data?.length;

  return (
    <Card>
      <CardContent>
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="maintenance">
              Maintenance
              {maintenanceCount ? <Badge variant="secondary">{maintenanceCount}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger value="children">
              Child items
              {item.children?.length ? (
                <Badge variant="secondary">{item.children.length}</Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <DetailsTab item={item} />
          </TabsContent>
          <TabsContent value="maintenance">
            <MaintenancePanel itemId={itemId} />
          </TabsContent>
          <TabsContent value="children">
            <ChildrenTab item={item} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
