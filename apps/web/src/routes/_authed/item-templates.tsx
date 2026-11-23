import { createFileRoute } from "@tanstack/react-router";
import { ItemTemplatesPage } from "~/components/item-templates/item-templates-page";

export const Route = createFileRoute("/_authed/item-templates")({
  component: ItemTemplatesPage,
});
