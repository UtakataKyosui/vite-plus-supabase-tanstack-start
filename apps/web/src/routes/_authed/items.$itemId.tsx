import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/items/$itemId")({
  component: ItemsItemidPage,
});

function ItemsItemidPage() {
  return <PageHeader title="Item" description="Item details." />;
}
