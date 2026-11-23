import { useState } from "react";
import type { FormEvent } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type {
  RepoEntityTemplateOut,
  RepoEntityTemplateUpdate,
  RepoTemplateField,
} from "~/api/generated/model";

type Props = {
  initial?: RepoEntityTemplateOut;
  submitLabel: string;
  pending?: boolean;
  error?: string | null;
  onSubmit: (values: RepoEntityTemplateUpdate) => void;
  onCancel: () => void;
};

const FIELD_TYPES = ["text", "number", "boolean", "time"] as const;

function FieldValueInput({
  field,
  onChange,
}: {
  field: RepoTemplateField;
  onChange: (f: RepoTemplateField) => void;
}) {
  switch (field.type) {
    case "number":
      return (
        <Input
          type="number"
          aria-label="Value"
          value={field.numberValue ?? ""}
          onChange={(e) =>
            onChange({
              ...field,
              numberValue: e.target.value === "" ? null : e.target.valueAsNumber,
            })
          }
        />
      );
    case "boolean":
      return (
        <div className="flex h-8 items-center">
          <Switch
            checked={!!field.booleanValue}
            onCheckedChange={(v) => onChange({ ...field, booleanValue: v })}
          />
        </div>
      );
    case "time":
      return (
        <Input
          type="date"
          aria-label="Value"
          value={field.timeValue?.slice(0, 10) ?? ""}
          onChange={(e) => onChange({ ...field, timeValue: e.target.value || null })}
        />
      );
    default:
      return (
        <Input
          aria-label="Value"
          value={field.textValue ?? ""}
          onChange={(e) => onChange({ ...field, textValue: e.target.value })}
        />
      );
  }
}

export function TemplateForm({ initial, submitLabel, pending, error, onSubmit, onCancel }: Props) {
  const [v, setV] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    notes: initial?.notes ?? "",
    defaultName: initial?.defaultName ?? "",
    defaultDescription: initial?.defaultDescription ?? "",
    defaultQuantity: initial?.defaultQuantity ?? 1,
    defaultManufacturer: initial?.defaultManufacturer ?? "",
    defaultModelNumber: initial?.defaultModelNumber ?? "",
    includePurchaseFields: initial?.includePurchaseFields ?? false,
    includeSoldFields: initial?.includeSoldFields ?? false,
    includeWarrantyFields: initial?.includeWarrantyFields ?? false,
    defaultInsured: initial?.defaultInsured ?? false,
    defaultLifetimeWarranty: initial?.defaultLifetimeWarranty ?? false,
  });
  const [fields, setFields] = useState<RepoTemplateField[]>(initial?.fields ?? []);
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!v.name.trim()) return;
    onSubmit({
      ...v,
      name: v.name.trim(),
      defaultQuantity: Number.isNaN(v.defaultQuantity) ? null : v.defaultQuantity,
      defaultLocationId: initial?.defaultLocation?.id ?? null,
      defaultTagIds: initial?.defaultTags?.map((t) => t.id ?? "").filter(Boolean) ?? null,
      defaultWarrantyDetails: initial?.defaultWarrantyDetails ?? null,
      fields: fields.filter((f) => f.name?.trim()),
    });
  };

  const switches = [
    ["includePurchaseFields", "Include purchase fields"],
    ["includeSoldFields", "Include sold fields"],
    ["includeWarrantyFields", "Include warranty fields"],
    ["defaultInsured", "Insured by default"],
    ["defaultLifetimeWarranty", "Lifetime warranty by default"],
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pe-1">
      <div className="space-y-1.5">
        <Label htmlFor="it-name">Template name</Label>
        <Input id="it-name" value={v.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="it-desc">Description</Label>
        <Textarea
          id="it-desc"
          value={v.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="it-dname">Default item name</Label>
          <Input
            id="it-dname"
            value={v.defaultName}
            onChange={(e) => set("defaultName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="it-qty">Default quantity</Label>
          <Input
            id="it-qty"
            type="number"
            min={0}
            value={Number.isNaN(v.defaultQuantity) ? "" : v.defaultQuantity}
            onChange={(e) => set("defaultQuantity", e.target.valueAsNumber)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="it-man">Manufacturer</Label>
          <Input
            id="it-man"
            value={v.defaultManufacturer}
            onChange={(e) => set("defaultManufacturer", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="it-model">Model number</Label>
          <Input
            id="it-model"
            value={v.defaultModelNumber}
            onChange={(e) => set("defaultModelNumber", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="it-ddesc">Default item description</Label>
        <Textarea
          id="it-ddesc"
          value={v.defaultDescription}
          onChange={(e) => set("defaultDescription", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="it-notes">Notes</Label>
        <Textarea id="it-notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {switches.map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <Switch id={`it-${key}`} checked={v[key]} onCheckedChange={(c) => set(key, c)} />
            <Label htmlFor={`it-${key}`}>{label}</Label>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Custom fields</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFields((f) => [...f, { name: "", type: "text", textValue: "" }])}
          >
            <PlusIcon /> Add field
          </Button>
        </div>
        {fields.map((f, i) => (
          <div key={i} className="grid grid-cols-[1fr_7rem_1fr_auto] items-center gap-2">
            <Input
              aria-label="Field name"
              placeholder="Name"
              value={f.name ?? ""}
              onChange={(e) =>
                setFields((all) =>
                  all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                )
              }
            />
            <Select
              value={f.type ?? "text"}
              onValueChange={(t) =>
                t && setFields((all) => all.map((x, j) => (j === i ? { ...x, type: t } : x)))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldValueInput
              field={f}
              onChange={(nf) => setFields((all) => all.map((x, j) => (j === i ? nf : x)))}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove field"
              onClick={() => setFields((all) => all.filter((_, j) => j !== i))}
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!v.name.trim() || pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
