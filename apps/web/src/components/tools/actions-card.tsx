import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CalendarX, Hash, Image, Link2, Play, Star, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  createMissingThumbnails,
  ensureAssetID,
  ensureImportRefs,
  itemDateZeroOut,
  setPrimaryPhotos,
  wipeInventory,
} from "~/api/generated/endpoints/actions/actions";
import type { V1ActionAmountResult, V1WipeInventoryOptions } from "~/api/generated/model";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Text } from "~/components/ui/text";
import { ConfirmDialog } from "./confirm-dialog";
import { ErrorNotice } from "./query-state";

type ActionDef = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  run: () => Promise<V1ActionAmountResult>;
  destructive?: boolean;
};

const actions: ActionDef[] = [
  {
    key: "asset-ids",
    title: "Ensure asset IDs",
    description: "Assign an asset ID to every item that does not have one.",
    icon: Hash,
    run: () => ensureAssetID(),
  },
  {
    key: "import-refs",
    title: "Ensure import refs",
    description: "Assign an import reference to every item that does not have one.",
    icon: Link2,
    run: () => ensureImportRefs(),
  },
  {
    key: "thumbnails",
    title: "Create missing thumbnails",
    description: "Generate thumbnails for photos that do not have one.",
    icon: Image,
    run: () => createMissingThumbnails(),
  },
  {
    key: "primary-photos",
    title: "Set primary photos",
    description: "Use the first photo as the primary photo for items without one.",
    icon: Star,
    run: () => setPrimaryPhotos(),
  },
  {
    key: "zero-dates",
    title: "Zero out item dates",
    description: "Reset the time portion of item dates. This modifies every item.",
    icon: CalendarX,
    run: () => itemDateZeroOut(),
    destructive: true,
  },
];

function ActionRow({ action }: { action: ActionDef }) {
  const [confirming, setConfirming] = useState(false);
  const mutation = useMutation({
    mutationFn: action.run,
    onSettled: () => setConfirming(false),
  });
  const Icon = action.icon;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{action.title}</p>
          <Text tone="muted" size="sm">
            {action.description}
          </Text>
          {mutation.isSuccess && (
            <Text size="sm" role="status">
              Completed: {mutation.data.completed ?? 0} affected.
            </Text>
          )}
          {mutation.error && !confirming && <ErrorNotice error={mutation.error} />}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={mutation.isPending}
        onClick={() => (action.destructive ? setConfirming(true) : mutation.mutate())}
      >
        <Play data-icon="inline-start" />
        {mutation.isPending ? "Running..." : "Run"}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={action.title}
        description={action.description}
        confirmLabel="Run"
        destructive
        pending={mutation.isPending}
        onConfirm={() => mutation.mutate()}
      />
    </div>
  );
}

const WIPE_PHRASE = "WIPE";

function WipeInventory() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Required<V1WipeInventoryOptions>>({
    wipeLocations: false,
    wipeMaintenance: false,
    wipeTags: false,
  });
  const [phrase, setPhrase] = useState("");
  const mutation = useMutation({
    mutationFn: () => wipeInventory(options),
    onSuccess: () => setOpen(false),
  });

  const toggles: { key: keyof typeof options; label: string }[] = [
    { key: "wipeLocations", label: "Also delete locations" },
    { key: "wipeTags", label: "Also delete tags" },
    { key: "wipeMaintenance", label: "Also delete maintenance records" },
  ];

  return (
    <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Trash2 className="mt-0.5 size-4 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Wipe inventory</p>
            <Text tone="muted" size="sm">
              Permanently delete every item in this group. This cannot be undone.
            </Text>
            {mutation.isSuccess && (
              <Text size="sm" role="status">
                Deleted {mutation.data.completed ?? 0} items.
              </Text>
            )}
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            setPhrase("");
            mutation.reset();
            setOpen(true);
          }}
        >
          Wipe...
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Wipe inventory"
        description="All items will be permanently deleted. This action cannot be undone."
        confirmLabel="Wipe inventory"
        destructive
        pending={mutation.isPending}
        onConfirm={() => phrase === WIPE_PHRASE && mutation.mutate()}
      >
        <div className="space-y-3">
          {toggles.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`wipe-${key}`}
                checked={options[key]}
                onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, [key]: checked }))}
              />
              <Label htmlFor={`wipe-${key}`}>{label}</Label>
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="wipe-phrase">Type {WIPE_PHRASE} to confirm</Label>
            <input
              id="wipe-phrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
          {mutation.error && <ErrorNotice error={mutation.error} />}
        </div>
      </ConfirmDialog>
    </div>
  );
}

export function ActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>Maintenance operations that run across the whole group.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="divide-y">
          {actions.map((action) => (
            <ActionRow key={action.key} action={action} />
          ))}
        </div>
        <Separator />
        <WipeInventory />
      </CardContent>
    </Card>
  );
}
