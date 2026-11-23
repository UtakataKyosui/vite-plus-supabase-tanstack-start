import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/label-templates/$templateId")({
  component: LabelTemplatesTemplateidPage,
});

function LabelTemplatesTemplateidPage() {
  return <PageHeader title="Label Template" description="Label template details." />;
}
