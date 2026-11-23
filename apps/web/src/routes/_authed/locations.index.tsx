import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/locations/")({
  component: LocationsPage,
});

function LocationsPage() {
  return <PageHeader title="Locations" description="Organize where your items live." />;
}
