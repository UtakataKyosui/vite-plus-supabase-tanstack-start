import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return <PageHeader title="Dashboard" description="Overview of your inventory." />;
}
