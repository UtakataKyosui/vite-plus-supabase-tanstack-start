import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/maintenance")({
  component: MaintenancePage,
});

function MaintenancePage() {
  return <PageHeader title="Maintenance" description="Track maintenance schedules." />;
}
