import { createFileRoute } from "@tanstack/react-router";
import { DangerZoneCard } from "~/components/group/danger-zone-card";
import { GroupDetailsCard } from "~/components/group/group-details-card";
import { InvitationsCard } from "~/components/group/invitations-card";
import { MembersCard } from "~/components/group/members-card";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/group")({
  component: GroupPage,
});

function GroupPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Group Settings"
        description="Manage your group, members, and invitations."
      />
      <GroupDetailsCard />
      <MembersCard />
      <InvitationsCard />
      <DangerZoneCard />
    </div>
  );
}
