import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, PrinterIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import { PageHeader } from "~/components/layout/page-header";
import {
  getLabelTemplatesGetAllQueryKey,
  getLabelTemplatesGetQueryKey,
  labelTemplatesPreview,
  labelTemplatesPrint,
  labelTemplatesRender,
  labelTemplatesUpdate,
  useLabelTemplatesGet,
} from "~/api/generated/endpoints/label-templates/label-templates";
import { LabelTemplateForm } from "./label-template-form";
import type { LabelTemplateFormValues } from "./label-template-form";

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong.";
}

function Preview({ id, version }: { id: string; version?: string }) {
  const q = useQuery({
    queryKey: [...getLabelTemplatesGetQueryKey(id), "preview", version],
    queryFn: () => labelTemplatesPreview(id),
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!q.data) return;
    const u = URL.createObjectURL(q.data);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [q.data]);

  if (q.isPending) return <Skeleton className="h-48 w-full" />;
  if (q.isError)
    return <p className="text-sm text-destructive">Preview failed: {errorMessage(q.error)}</p>;
  if (q.data.type === "application/pdf")
    return url && <iframe src={url} title="Label preview" className="h-80 w-full rounded-md" />;
  return (
    url && (
      <div className="flex justify-center rounded-md border bg-muted/40 p-4">
        <img src={url} alt="Label preview" className="max-h-72 bg-white shadow-sm" />
      </div>
    )
  );
}

function PrintPanel({ id }: { id: string }) {
  const [ids, setIds] = useState("");
  const [copies, setCopies] = useState(1);
  const itemIds = ids
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const render = useMutation({
    mutationFn: () => labelTemplatesRender(id, { itemIds }),
    onSuccess: (blob) => {
      const u = URL.createObjectURL(blob);
      window.open(u, "_blank");
      setTimeout(() => URL.revokeObjectURL(u), 60_000);
    },
  });
  const print = useMutation({
    mutationFn: () => labelTemplatesPrint(id, { itemIds, copies }),
  });
  const disabled = itemIds.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Render and print</CardTitle>
        <CardDescription>Enter item IDs (comma or newline separated).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={ids}
          onChange={(e) => setIds(e.target.value)}
          placeholder="item-id-1, item-id-2"
          aria-label="Item IDs"
        />
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="lt-copies">Copies</Label>
            <Input
              id="lt-copies"
              type="number"
              min={1}
              className="w-24"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, e.target.valueAsNumber || 1))}
            />
          </div>
          <Button
            variant="outline"
            disabled={disabled || render.isPending}
            onClick={() => render.mutate()}
          >
            Render
          </Button>
          <Button disabled={disabled || print.isPending} onClick={() => print.mutate()}>
            <PrinterIcon /> Print
          </Button>
        </div>
        {render.isError && <p className="text-sm text-destructive">{errorMessage(render.error)}</p>}
        {print.isError && <p className="text-sm text-destructive">{errorMessage(print.error)}</p>}
        {print.isSuccess && (
          <p className="text-sm text-muted-foreground">
            {print.data.message || `Printed ${print.data.labelCount ?? 0} label(s).`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function LabelTemplateEditor({ templateId }: { templateId: string }) {
  const qc = useQueryClient();
  const query = useLabelTemplatesGet(templateId);

  const update = useMutation({
    mutationFn: (v: LabelTemplateFormValues) =>
      labelTemplatesUpdate(templateId, {
        ...v,
        id: templateId,
        canvasData: query.data?.canvasData,
        sheetLayout: query.data?.sheetLayout,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: getLabelTemplatesGetQueryKey(templateId) });
      await qc.invalidateQueries({ queryKey: getLabelTemplatesGetAllQueryKey() });
    },
  });

  const back = (
    <Button variant="outline" render={<Link to="/label-templates" />}>
      <ArrowLeftIcon /> Back
    </Button>
  );

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <PageHeader title="Label Template" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Label Template" actions={back} />
        <p className="text-sm text-destructive">
          Failed to load template: {errorMessage(query.error)}
        </p>
      </div>
    );
  }

  const t = query.data;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t.name || "Label Template"}
        description={`${t.width} x ${t.height} mm`}
        actions={back}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <LabelTemplateForm
              key={t.updatedAt}
              initial={t}
              submitLabel="Save changes"
              pending={update.isPending}
              error={update.isError ? errorMessage(update.error) : null}
              onSubmit={(v) => update.mutate(v)}
            />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Preview id={templateId} version={t.updatedAt} />
            </CardContent>
          </Card>
          <PrintPanel id={templateId} />
        </div>
      </div>
    </div>
  );
}
