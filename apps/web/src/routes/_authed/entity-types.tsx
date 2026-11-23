import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/entity-types")({
  component: EntityTypesPage,
});

function EntityTypesPage() {
  return <PageHeader title="Entity Types" description="Manage entity types." />;
}
