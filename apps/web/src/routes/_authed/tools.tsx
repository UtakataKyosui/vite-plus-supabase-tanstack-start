import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/tools")({
  component: ToolsPage,
});

function ToolsPage() {
  return <PageHeader title="Tools" description="Import, export and utilities." />;
}
