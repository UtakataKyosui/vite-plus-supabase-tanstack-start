import type { RepoEntityOut, RepoEntityUpdate, RepoTreeItem } from "~/api/generated/model";

export type FlatLocation = { id: string; name: string; depth: number };

export function locationsOnly(nodes: RepoTreeItem[] = []): RepoTreeItem[] {
  return nodes
    .filter((n) => !n.type || n.type === "location")
    .map((n) => ({ ...n, children: locationsOnly(n.children) }));
}

export function flattenLocations(nodes: RepoTreeItem[], depth = 0): FlatLocation[] {
  return nodes.flatMap((n) => [
    { id: n.id ?? "", name: n.name ?? "", depth },
    ...flattenLocations(n.children ?? [], depth + 1),
  ]);
}

export function descendantIds(nodes: RepoTreeItem[], id: string): Set<string> {
  const result = new Set<string>();
  const collect = (n: RepoTreeItem) => {
    if (n.id) result.add(n.id);
    n.children?.forEach(collect);
  };
  const find = (list: RepoTreeItem[]): boolean => {
    for (const n of list) {
      if (n.id === id) {
        collect(n);
        return true;
      }
      if (find(n.children ?? [])) return true;
    }
    return false;
  };
  find(nodes);
  return result;
}

export function toEntityUpdate(entity: RepoEntityOut): RepoEntityUpdate {
  return {
    archived: entity.archived,
    assetId: entity.assetId,
    description: entity.description,
    entityTypeId: entity.entityType?.id ?? null,
    fields: entity.fields,
    id: entity.id,
    insured: entity.insured,
    lifetimeWarranty: entity.lifetimeWarranty,
    locationId: entity.locationId ?? null,
    manufacturer: entity.manufacturer,
    modelNumber: entity.modelNumber,
    name: entity.name ?? "",
    notes: entity.notes,
    parentId: entity.parent?.id ?? null,
    purchaseDate: entity.purchaseDate,
    purchaseFrom: entity.purchaseFrom,
    purchasePrice: entity.purchasePrice,
    quantity: entity.quantity,
    serialNumber: entity.serialNumber,
    soldDate: entity.soldDate,
    soldNotes: entity.soldNotes,
    soldPrice: entity.soldPrice,
    soldTo: entity.soldTo,
    syncChildEntityLocations: entity.syncChildEntityLocations,
    tagIds: entity.tags?.map((t) => t.id ?? "").filter(Boolean),
    warrantyDetails: entity.warrantyDetails,
    warrantyExpires: entity.warrantyExpires,
  };
}
