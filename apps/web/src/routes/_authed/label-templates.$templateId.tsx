import { createFileRoute } from "@tanstack/react-router";
import { LabelTemplateEditor } from "~/components/label-templates/label-template-editor";

export const Route = createFileRoute("/_authed/label-templates/$templateId")({
  component: LabelTemplateDetailPage,
});

function LabelTemplateDetailPage() {
  const { templateId } = Route.useParams();
  return <LabelTemplateEditor templateId={templateId} />;
}
