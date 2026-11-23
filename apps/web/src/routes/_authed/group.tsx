import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/group")({
  component: GroupPage,
});

function GroupPage() {
  return <PageHeader title="Group Settings" description="Manage your group." />;
}
