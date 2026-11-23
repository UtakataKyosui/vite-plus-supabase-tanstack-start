import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/items/new")({
  component: ItemsNewPage,
});

function ItemsNewPage() {
  return <PageHeader title="New Item" description="Create a new item." />;
}
