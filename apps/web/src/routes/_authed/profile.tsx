import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return <PageHeader title="Profile" description="Manage your profile." />;
}
