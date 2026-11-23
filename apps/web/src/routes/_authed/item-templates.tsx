import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/item-templates")({
  component: ItemTemplatesPage,
});

function ItemTemplatesPage() {
  return <PageHeader title="Item Templates" description="Manage item templates." />;
}
