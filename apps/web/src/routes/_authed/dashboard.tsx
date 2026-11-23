import { createFileRoute } from "@tanstack/react-router";
import { ItemsByLocationCard, ItemsByTagCard } from "~/components/dashboard/breakdown-cards";
import { RecentItemsCard } from "~/components/dashboard/recent-items-card";
import { StatCards } from "~/components/dashboard/stat-cards";
import { ValueOverTimeCard } from "~/components/dashboard/value-over-time-card";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="Overview of your home & office inventory" />
      <StatCards />
      <ValueOverTimeCard />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ItemsByLocationCard />
        <ItemsByTagCard />
      </div>
      <RecentItemsCard />
    </div>
  );
}
