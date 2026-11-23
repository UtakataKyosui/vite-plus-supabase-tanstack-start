import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";
import { ActionsCard } from "~/components/tools/actions-card";
import { ExportImportCard } from "~/components/tools/export-import-card";

export const Route = createFileRoute("/_authed/tools")({
  component: ToolsPage,
});

function ToolsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tools" description="Import, export, and bulk maintenance actions." />
      <ExportImportCard />
      <ActionsCard />
    </div>
  );
}
