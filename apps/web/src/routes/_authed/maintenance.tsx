import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";
import { MaintenanceList } from "~/components/maintenance/maintenance-list";

export const Route = createFileRoute("/_authed/maintenance")({
  component: MaintenancePage,
});

function MaintenancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" description="Track maintenance schedules across all items." />
      <MaintenanceList />
    </div>
  );
}
