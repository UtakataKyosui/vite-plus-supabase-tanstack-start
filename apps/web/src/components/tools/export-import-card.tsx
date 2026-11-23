import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileArchive, Trash2, Upload } from "lucide-react";
import {
  collectionImport,
  exportDelete,
  exportDownload,
  exportsCreate,
  getExportsListQueryKey,
  useExportsList,
} from "~/api/generated/endpoints/group/group";
import type { RepoExportOut } from "~/api/generated/model";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Text } from "~/components/ui/text";
import { ConfirmDialog } from "./confirm-dialog";
import { ErrorNotice, RowsSkeleton, formatDate } from "./query-state";

function formatSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const statusVariant = (status?: string) =>
  status === "failed" ? "destructive" : status === "completed" ? "default" : "secondary";

export function ExportImportCard() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmingImport, setConfirmingImport] = useState(false);
  const [deleting, setDeleting] = useState<RepoExportOut | null>(null);
  const { data, isPending, error } = useExportsList();
  const items = data?.items ?? [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: getExportsListQueryKey() });

  const create = useMutation({ mutationFn: () => exportsCreate(), onSuccess: refresh });
  const remove = useMutation({
    mutationFn: (id: string) => exportDelete(id),
    onSuccess: () => {
      setDeleting(null);
      return refresh();
    },
  });
  const download = useMutation({
    mutationFn: async (entry: RepoExportOut) => {
      const blob = await exportDownload(entry.id ?? "");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `export-${entry.id}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
  });
  const importFile = useMutation({
    mutationFn: (file: File) => collectionImport({ file }),
    onSuccess: () => {
      setConfirmingImport(false);
      setPendingFile(null);
      if (fileInput.current) fileInput.current.value = "";
      return refresh();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import / Export</CardTitle>
        <CardDescription>Back up your inventory or restore it from an export file.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text tone="muted">Create a new export archive of this group.</Text>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            <FileArchive data-icon="inline-start" />
            {create.isPending ? "Creating..." : "Create export"}
          </Button>
        </div>
        {create.error && <ErrorNotice error={create.error} />}
        {download.error && <ErrorNotice error={download.error} />}

        {isPending ? (
          <RowsSkeleton />
        ) : error ? (
          <ErrorNotice error={error} />
        ) : items.length === 0 ? (
          <Text tone="muted" className="py-4 text-center">
            No exports yet.
          </Text>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDate(entry.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(entry.status)}>{entry.status ?? "unknown"}</Badge>
                    {entry.error && <p className="text-xs text-destructive">{entry.error}</p>}
                  </TableCell>
                  <TableCell>{formatSize(entry.sizeBytes)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Download"
                        disabled={entry.status !== "completed" || download.isPending}
                        onClick={() => download.mutate(entry)}
                      >
                        <Download />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete"
                        onClick={() => setDeleting(entry)}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Separator />

        <div className="space-y-3">
          <Text tone="muted">Import an export archive (.zip) into this group.</Text>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              accept=".zip,application/zip"
              aria-label="Import file"
              className="text-sm file:me-3 file:rounded-lg file:border file:border-input file:bg-transparent file:px-3 file:py-1 file:text-sm"
              onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="outline"
              disabled={!pendingFile}
              onClick={() => setConfirmingImport(true)}
            >
              <Upload data-icon="inline-start" />
              Import
            </Button>
          </div>
          {importFile.isSuccess && <Text tone="muted">Import started.</Text>}
        </div>
      </CardContent>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete export"
        description="This export archive will be permanently deleted."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting?.id && remove.mutate(deleting.id)}
      >
        {remove.error && <ErrorNotice error={remove.error} />}
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmingImport}
        onOpenChange={setConfirmingImport}
        title="Import collection"
        description={`Import "${pendingFile?.name ?? ""}" into this group? Existing data may be merged or duplicated.`}
        confirmLabel="Import"
        pending={importFile.isPending}
        onConfirm={() => pendingFile && importFile.mutate(pendingFile)}
      >
        {importFile.error && <ErrorNotice error={importFile.error} />}
      </ConfirmDialog>
    </Card>
  );
}
