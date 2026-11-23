import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/label-templates/")({
  component: LabelTemplatesPage,
});

function LabelTemplatesPage() {
  return <PageHeader title="Label Templates" description="Manage label templates." />;
}
