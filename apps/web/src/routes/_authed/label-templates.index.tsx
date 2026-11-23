import { createFileRoute } from "@tanstack/react-router";
import { LabelTemplatesList } from "~/components/label-templates/label-templates-list";

export const Route = createFileRoute("/_authed/label-templates/")({
  component: LabelTemplatesList,
});
