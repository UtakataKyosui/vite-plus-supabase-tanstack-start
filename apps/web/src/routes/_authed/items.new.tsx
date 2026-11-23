import { createFileRoute } from "@tanstack/react-router";
import { ItemForm, type ItemDraft } from "~/components/items/item-form";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/items/new")({
  validateSearch: (search: Record<string, unknown>): ItemDraft => {
    const text = (key: string) =>
      typeof search[key] === "string" && search[key] ? (search[key] as string) : undefined;
    const barcode = text("barcode");
    const notes = text("notes");
    return {
      name: text("name"),
      description: text("description"),
      manufacturer: text("manufacturer"),
      modelNumber: text("modelNumber"),
      notes: [notes, barcode && `Barcode: ${barcode}`].filter(Boolean).join("\n") || undefined,
    };
  },
  component: NewItemPage,
});

function NewItemPage() {
  const search = Route.useSearch();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Create new item"
        description="Add physical hardware, tools, or equipment with tracking identifiers and storage zones."
      />
      <ItemForm draft={search} />
    </div>
  );
}
