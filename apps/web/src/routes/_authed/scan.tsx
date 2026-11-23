import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/_authed/scan")({
  component: ScanPage,
});

function ScanPage() {
  return <PageHeader title="Scan" description="Scan a label or barcode." />;
}
