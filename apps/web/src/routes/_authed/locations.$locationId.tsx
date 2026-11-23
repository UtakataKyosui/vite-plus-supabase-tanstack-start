import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/locations/$locationId")({
  component: LocationsLocationidPage,
});

function LocationsLocationidPage() {
  return <PageHeader title="Location" description="Location details." />;
}
