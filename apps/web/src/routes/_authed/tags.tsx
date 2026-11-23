import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/tags")({
  component: TagsPage,
});

function TagsPage() {
  return <PageHeader title="Tags" description="Manage tags." />;
}
