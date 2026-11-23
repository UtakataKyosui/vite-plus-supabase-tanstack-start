import { createFileRoute } from "@tanstack/react-router";
import { ItemForm } from "~/components/items/item-form";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/items/new")({
  component: NewItemPage,
});

function NewItemPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Create new item"
        description="Add physical hardware, tools, or equipment with tracking identifiers and storage zones."
      />
      <ItemForm />
    </div>
  );
}
