import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";
import { ApiKeysCard } from "~/components/profile/api-keys-card";
import { DeleteAccountCard } from "~/components/profile/delete-account-card";
import { NotifiersCard } from "~/components/profile/notifiers-card";
import { ProfileCard } from "~/components/profile/profile-card";

export const Route = createFileRoute("/_authed/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile & Settings"
        description="Manage your account, API keys, and notifications."
      />
      <ProfileCard />
      <ApiKeysCard />
      <NotifiersCard />
      <DeleteAccountCard />
    </div>
  );
}
