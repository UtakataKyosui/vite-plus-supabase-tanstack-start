import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  ExternalLink,
  FileText,
  ImagePlus,
  ImageOff,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  entityAttachmentCreate,
  entityAttachmentDelete,
} from "~/api/generated/endpoints/entities-attachments/entities-attachments";
import type { RepoEntityOut, RepoItemAttachment } from "~/api/generated/model";
import { Button } from "~/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "cn";
import { attachmentSrc } from "./format";
import { errorMessage } from "./query-state";

function useUpload(itemId: string, hasPrimary: boolean) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ files, photo }: { files: File[]; photo: boolean }) => {
      for (const [i, file] of files.entries()) {
        await entityAttachmentCreate(itemId, {
          file,
          name: file.name,
          type: photo ? "photo" : "attachment",
          primary: photo && !hasPrimary && i === 0,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

function useRemove(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => entityAttachmentDelete(itemId, attachmentId),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

const isPhoto = (a: RepoItemAttachment) => a.type === "photo";
const isDocument = (a: RepoItemAttachment) => a.type !== "photo" && a.type !== "thumbnail";

export function ItemGallery({ item }: { item: RepoEntityOut }) {
  const itemId = item.id ?? "";
  const photos = (item.attachments ?? []).filter(isPhoto);
  const [activeId, setActiveId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const upload = useUpload(
    itemId,
    photos.some((p) => p.primary),
  );
  const remove = useRemove(itemId);

  const active =
    photos.find((p) => p.id === activeId) ?? photos.find((p) => p.primary) ?? photos[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImagePlus className="size-4 text-primary" />
          Photos ({photos.length})
        </CardTitle>
        <CardAction>
          <input
            ref={input}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) upload.mutate({ files, photo: true });
              e.target.value = "";
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => input.current?.click()}
            disabled={upload.isPending}
          >
            <UploadCloud />
            {upload.isPending ? "Uploading..." : "Add photo"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground">
          {active ? (
            <img
              src={attachmentSrc(itemId, active.id)}
              alt={active.title || item.name}
              className="size-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-sm">
              <ImageOff className="size-8" />
              No photos yet
            </div>
          )}
          {active?.primary && (
            <span className="absolute bottom-2 left-2 rounded-md bg-background/90 px-2 py-1 text-xs font-medium">
              Primary photo
            </span>
          )}
        </div>
        {photos.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setActiveId(photo.id ?? null)}
                aria-label={`Show ${photo.title || "photo"}`}
                className={cn(
                  "aspect-square overflow-hidden rounded-md border bg-muted",
                  photo.id === active?.id && "ring-2 ring-primary",
                )}
              >
                <img
                  src={attachmentSrc(itemId, photo.id)}
                  alt=""
                  className="size-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
        {active?.id && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            disabled={remove.isPending}
            onClick={() => remove.mutate(active.id ?? "")}
          >
            <Trash2 />
            Remove this photo
          </Button>
        )}
        {(upload.error || remove.error) && (
          <p className="text-sm text-destructive">{errorMessage(upload.error ?? remove.error)}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ItemDocuments({ item }: { item: RepoEntityOut }) {
  const itemId = item.id ?? "";
  const docs = (item.attachments ?? []).filter(isDocument);
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const upload = useUpload(itemId, true);
  const remove = useRemove(itemId);

  const send = (files: File[]) => {
    if (files.length) upload.mutate({ files, photo: false });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-primary" />
          Documents & manuals ({docs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {docs.map((doc) => {
          const href = attachmentSrc(itemId, doc.id);
          return (
            <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-muted-foreground uppercase">
                {doc.title?.split(".").pop()?.slice(0, 4) || "file"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.title || "Untitled"}</p>
                <p className="truncate text-xs text-muted-foreground">{doc.type}</p>
              </div>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label="Open"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-4" />
              </a>
              <a
                href={href}
                download={doc.title}
                aria-label="Download"
                className="text-muted-foreground hover:text-foreground"
              >
                <Download className="size-4" />
              </a>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete attachment"
                disabled={remove.isPending}
                onClick={() => remove.mutate(doc.id ?? "")}
              >
                <Trash2 />
              </Button>
            </div>
          );
        })}
        <input
          ref={input}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            send(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            send(Array.from(e.dataTransfer.files));
          }}
          className={cn(
            "flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed p-5 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/50",
            dragging && "border-primary bg-muted/50",
          )}
        >
          <UploadCloud className="size-5" />
          {upload.isPending
            ? "Uploading..."
            : "Drag & drop receipts, PDFs or specs, or browse files"}
        </button>
        {(upload.error || remove.error) && (
          <p className="text-sm text-destructive">{errorMessage(upload.error ?? remove.error)}</p>
        )}
      </CardContent>
    </Card>
  );
}
