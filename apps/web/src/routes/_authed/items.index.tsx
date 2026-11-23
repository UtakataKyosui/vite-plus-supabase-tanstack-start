import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/items/")({
  component: ItemsPage,
});

function ItemsPage() {
  return <PageHeader title="Items" description="Browse and manage your items." />;
}
