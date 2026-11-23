import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FileText, ImagePlus, Minus, Plus, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  entitiesCreate,
  entityUpdate,
  useLocationTreeQuery,
} from "~/api/generated/endpoints/entities/entities";
import { entityAttachmentCreate } from "~/api/generated/endpoints/entities-attachments/entities-attachments";
import { useEntityTypeGetAll } from "~/api/generated/endpoints/entity-types/entity-types";
import { useTagsGetAll } from "~/api/generated/endpoints/tags/tags";
import type { RepoEntityOut, RepoTreeItem } from "~/api/generated/model";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "cn";
import { formatBytes } from "./format";
import { errorMessage } from "./query-state";

const NONE = "__none__";
const NAME_MAX = 255;

type CustomField = { id: number; name: string; value: string };

type FormState = {
  name: string;
  description: string;
  entityTypeId: string;
  parentId: string;
  quantity: string;
  tagIds: string[];
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  lifetimeWarranty: boolean;
  warrantyExpires: string;
  warrantyDetails: string;
  purchasePrice: string;
  purchaseDate: string;
  purchaseFrom: string;
  notes: string;
  fields: CustomField[];
};

const INITIAL: FormState = {
  name: "",
  description: "",
  entityTypeId: NONE,
  parentId: NONE,
  quantity: "1",
  tagIds: [],
  manufacturer: "",
  modelNumber: "",
  serialNumber: "",
  lifetimeWarranty: false,
  warrantyExpires: "",
  warrantyDetails: "",
  purchasePrice: "",
  purchaseDate: "",
  purchaseFrom: "",
  notes: "",
  fields: [],
};

type Errors = Partial<Record<"name" | "quantity" | "purchasePrice", string>>;

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = "Item name is required.";
  else if (form.name.trim().length > NAME_MAX)
    errors.name = `Name must be ${NAME_MAX} characters or fewer.`;

  const qty = Number(form.quantity);
  if (!Number.isInteger(qty) || qty < 1)
    errors.quantity = "Quantity must be a whole number of 1 or more.";

  if (form.purchasePrice.trim() !== "") {
    const price = Number(form.purchasePrice);
    if (!Number.isFinite(price) || price < 0) errors.purchasePrice = "Enter a price of 0 or more.";
  }
  return errors;
}

function flattenTree(nodes: RepoTreeItem[] = [], depth = 0): { value: string; label: string }[] {
  return nodes.flatMap((n) => [
    { value: n.id ?? "", label: `${"  ".repeat(depth)}${n.name ?? ""}` },
    ...flattenTree(n.children, depth + 1),
  ]);
}

function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function Section({
  index,
  title,
  description,
  children,
}: {
  index: number;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          Section {String(index).padStart(2, "0")}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export type ItemDraft = Partial<
  Pick<FormState, "name" | "description" | "manufacturer" | "modelNumber" | "notes">
>;

export function ItemForm({ draft }: { draft?: ItemDraft }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const nextFieldId = useRef(1);
  const [form, setForm] = useState<FormState>(() => ({ ...INITIAL, ...draft }));
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [partial, setPartial] = useState<{ id: string; message: string } | null>(null);

  const types = useEntityTypeGetAll().data ?? [];
  const tags = useTagsGetAll().data ?? [];
  const tree = useLocationTreeQuery().data;
  const locations = useMemo(() => flattenTree(tree), [tree]);

  const errors = validate(form);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const typeItems = [{ value: NONE, label: "No type" }].concat(
    types.map((t) => ({ value: t.id ?? "", label: t.name ?? "" })),
  );
  const locationItems = [{ value: NONE, label: "No location" }].concat(locations);

  const create = useMutation({
    mutationFn: async () => {
      const created = await entitiesCreate({
        name: form.name.trim(),
        description: form.description,
        entityTypeId: form.entityTypeId === NONE ? null : form.entityTypeId,
        parentId: form.parentId === NONE ? null : form.parentId,
        manufacturer: form.manufacturer.trim() || null,
        modelNumber: form.modelNumber.trim() || null,
        quantity: Number(form.quantity),
        tagIds: form.tagIds,
      });
      const id = created.id ?? "";
      const problems: string[] = [];

      const fields = form.fields
        .filter((f) => f.name.trim())
        .map((f) => ({ name: f.name.trim(), type: "text", textValue: f.value }));
      const hasDetails =
        form.serialNumber.trim() ||
        form.lifetimeWarranty ||
        form.warrantyExpires ||
        form.warrantyDetails.trim() ||
        form.purchasePrice.trim() ||
        form.purchaseDate ||
        form.purchaseFrom.trim() ||
        form.notes.trim() ||
        fields.length > 0;

      if (hasDetails) {
        try {
          await entityUpdate(id, buildUpdate(created, form, fields));
        } catch (e) {
          problems.push(`details (${errorMessage(e)})`);
        }
      }

      for (const [i, file] of files.entries()) {
        try {
          const isImage = file.type.startsWith("image/");
          await entityAttachmentCreate(id, {
            file,
            name: file.name,
            type: isImage ? "photo" : "attachment",
            primary: isImage && i === files.findIndex((f) => f.type.startsWith("image/")),
          });
        } catch (e) {
          problems.push(`${file.name} (${errorMessage(e)})`);
        }
      }
      return { id, problems };
    },
    onSuccess: async ({ id, problems }) => {
      await queryClient.invalidateQueries();
      if (problems.length > 0) {
        setPartial({
          id,
          message: `The item was created, but some data could not be saved: ${problems.join("; ")}.`,
        });
        return;
      }
      await navigate({ to: "/items/$itemId", params: { itemId: id } });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    create.mutate();
  };

  const showError = (key: keyof Errors) => (submitted ? errors[key] : undefined);
  const qty = Number(form.quantity) || 0;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Section index={1} title="Basic information">
            <Field label="Item name" htmlFor="item-name" required error={showError("name")}>
              <div className="relative">
                <Input
                  id="item-name"
                  value={form.name}
                  maxLength={NAME_MAX}
                  aria-invalid={Boolean(showError("name"))}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. DeWalt 20V Max Cordless Drill Kit"
                  autoFocus
                />
                <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[11px] text-muted-foreground">
                  {form.name.length}/{NAME_MAX}
                </span>
              </div>
            </Field>
            <Field
              label="Description & identification notes"
              htmlFor="item-description"
              hint="Visual marks, serial label location, or scratches help with loss recovery."
            >
              <Textarea
                id="item-description"
                value={form.description}
                maxLength={1000}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Entity type">
                <Select
                  items={typeItems}
                  value={form.entityTypeId}
                  onValueChange={(v) => set("entityTypeId", v ?? NONE)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeItems.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Quantity" htmlFor="item-quantity" error={showError("quantity")}>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Decrease quantity"
                    disabled={qty <= 1}
                    onClick={() => set("quantity", String(Math.max(1, qty - 1)))}
                  >
                    <Minus />
                  </Button>
                  <Input
                    id="item-quantity"
                    inputMode="numeric"
                    value={form.quantity}
                    aria-invalid={Boolean(showError("quantity"))}
                    onChange={(e) => set("quantity", e.target.value)}
                    className="text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Increase quantity"
                    onClick={() => set("quantity", String(qty + 1))}
                  >
                    <Plus />
                  </Button>
                </div>
              </Field>
            </div>
            <Field label="Parent storage location">
              <Select
                items={locationItems}
                value={form.parentId}
                onValueChange={(v) => set("parentId", v ?? NONE)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationItems.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tags & classification">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tags yet. Create tags from the Tags page.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const on = form.tagIds.includes(tag.id ?? "");
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          set(
                            "tagIds",
                            on
                              ? form.tagIds.filter((t) => t !== tag.id)
                              : [...form.tagIds, tag.id ?? ""],
                          )
                        }
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </Field>
          </Section>

          <Section
            index={2}
            title="Product & hardware identifiers"
            description="Serial and model registry"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Manufacturer / brand" htmlFor="item-manufacturer">
                <Input
                  id="item-manufacturer"
                  value={form.manufacturer}
                  onChange={(e) => set("manufacturer", e.target.value)}
                />
              </Field>
              <Field label="Model number" htmlFor="item-model">
                <Input
                  id="item-model"
                  value={form.modelNumber}
                  onChange={(e) => set("modelNumber", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Serial number" htmlFor="item-serial">
              <Input
                id="item-serial"
                value={form.serialNumber}
                onChange={(e) => set("serialNumber", e.target.value)}
                className="font-mono"
              />
            </Field>
            <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-3">
              <div>
                <Label htmlFor="item-lifetime">Lifetime warranty coverage</Label>
                <p className="text-xs text-muted-foreground">
                  Manufacturer guarantees replacement for original owner defects.
                </p>
              </div>
              <Switch
                id="item-lifetime"
                checked={form.lifetimeWarranty}
                onCheckedChange={(v) => set("lifetimeWarranty", v)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Warranty expiration date" htmlFor="item-warranty-date">
                <Input
                  id="item-warranty-date"
                  type="date"
                  value={form.warrantyExpires}
                  disabled={form.lifetimeWarranty}
                  onChange={(e) => set("warrantyExpires", e.target.value)}
                />
              </Field>
              <Field label="Support & claim terms" htmlFor="item-warranty-details">
                <Input
                  id="item-warranty-details"
                  value={form.warrantyDetails}
                  onChange={(e) => set("warrantyDetails", e.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section
            index={3}
            title="Custom attributes & specifications"
            description="Flexible key-value pairs for technical specs, materials, and sizing."
          >
            {form.fields.map((field) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  aria-label="Field name"
                  placeholder="Name"
                  value={field.name}
                  className="w-2/5"
                  onChange={(e) =>
                    set(
                      "fields",
                      form.fields.map((f) =>
                        f.id === field.id ? { ...f, name: e.target.value } : f,
                      ),
                    )
                  }
                />
                <Input
                  aria-label="Field value"
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) =>
                    set(
                      "fields",
                      form.fields.map((f) =>
                        f.id === field.id ? { ...f, value: e.target.value } : f,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove field"
                  onClick={() =>
                    set(
                      "fields",
                      form.fields.filter((f) => f.id !== field.id),
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={() =>
                set("fields", [...form.fields, { id: nextFieldId.current++, name: "", value: "" }])
              }
            >
              <Plus />
              Add custom field
            </Button>
          </Section>

          <Section index={4} title="Operational notes">
            <Field label="Handling & storage protocol" htmlFor="item-notes">
              <Textarea
                id="item-notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={4}
              />
            </Field>
          </Section>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valuation & acquisition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Purchase price" htmlFor="item-price" error={showError("purchasePrice")}>
                <Input
                  id="item-price"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.purchasePrice}
                  aria-invalid={Boolean(showError("purchasePrice"))}
                  onChange={(e) => set("purchasePrice", e.target.value)}
                />
              </Field>
              <Field label="Purchase date" htmlFor="item-purchase-date">
                <Input
                  id="item-purchase-date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => set("purchaseDate", e.target.value)}
                />
              </Field>
              <Field label="Vendor / source" htmlFor="item-vendor">
                <Input
                  id="item-vendor"
                  value={form.purchaseFrom}
                  onChange={(e) => set("purchaseFrom", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photos & files</CardTitle>
              <CardDescription>Uploaded after the item is created.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileInput}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/50"
              >
                <ImagePlus className="size-6" />
                <span className="font-medium text-foreground">Click to upload</span>
                <span className="text-xs">PNG, JPG, PDF receipts</span>
              </button>
              {files.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-3 rounded-lg border p-2.5"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {(create.error || partial) && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {partial ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{partial.message}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => navigate({ to: "/items/$itemId", params: { itemId: partial.id } })}
              >
                Open item
              </Button>
            </div>
          ) : (
            errorMessage(create.error)
          )}
        </div>
      )}

      <div className="sticky bottom-0 z-20 -mx-1 flex items-center justify-end gap-2 border-t bg-background/90 px-1 py-3 backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/items" })}
          disabled={create.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={create.isPending || partial !== null}>
          {create.isPending ? "Creating..." : "Create item"}
        </Button>
      </div>
    </form>
  );
}

function buildUpdate(
  created: RepoEntityOut,
  form: FormState,
  fields: { name: string; type: string; textValue: string }[],
) {
  return {
    name: created.name ?? form.name.trim(),
    description: form.description,
    entityTypeId: form.entityTypeId === NONE ? null : form.entityTypeId,
    parentId: form.parentId === NONE ? null : form.parentId,
    manufacturer: form.manufacturer.trim(),
    modelNumber: form.modelNumber.trim(),
    quantity: Number(form.quantity),
    tagIds: form.tagIds,
    serialNumber: form.serialNumber.trim(),
    lifetimeWarranty: form.lifetimeWarranty,
    warrantyExpires: form.warrantyExpires || undefined,
    warrantyDetails: form.warrantyDetails.trim(),
    purchasePrice: form.purchasePrice.trim() === "" ? null : Number(form.purchasePrice),
    purchaseDate: form.purchaseDate || undefined,
    purchaseFrom: form.purchaseFrom.trim(),
    notes: form.notes,
    fields,
  };
}
