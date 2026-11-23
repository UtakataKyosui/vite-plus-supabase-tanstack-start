import { useState } from "react";
import type { FormEvent } from "react";
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
import { useLabelTemplatesPresets } from "~/api/generated/endpoints/label-templates/label-templates";
import type { RepoLabelTemplateOut } from "~/api/generated/model";

export type LabelTemplateFormValues = {
  name: string;
  description: string;
  width: number;
  height: number;
  dpi: number;
  offsetX: number;
  offsetY: number;
  outputFormat: "png" | "pdf";
  isShared: boolean;
  preset: string | null;
};

type Props = {
  initial?: RepoLabelTemplateOut;
  submitLabel: string;
  pending?: boolean;
  error?: string | null;
  onSubmit: (values: LabelTemplateFormValues) => void;
  onCancel?: () => void;
};

const NO_PRESET = "__none__";

function NumberField({
  id,
  label,
  value,
  onChange,
  step,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step ?? "any"}
        value={Number.isNaN(value) ? "" : value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
      />
    </div>
  );
}

export function LabelTemplateForm({
  initial,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const presets = useLabelTemplatesPresets();
  const [values, setValues] = useState<LabelTemplateFormValues>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    width: initial?.width ?? 62,
    height: initial?.height ?? 29,
    dpi: initial?.dpi ?? 300,
    offsetX: initial?.offsetX ?? 0,
    offsetY: initial?.offsetY ?? 0,
    outputFormat: initial?.outputFormat === "pdf" ? "pdf" : "png",
    isShared: initial?.isShared ?? false,
    preset: initial?.preset || null,
  });
  const set = <K extends keyof LabelTemplateFormValues>(k: K, v: LabelTemplateFormValues[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const valid = values.name.trim() !== "" && values.width > 0 && values.height > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (valid) onSubmit({ ...values, name: values.name.trim() });
  };

  const applyPreset = (key: string | null) => {
    if (!key || key === NO_PRESET) {
      set("preset", null);
      return;
    }
    const p = presets.data?.find((x) => x.key === key);
    setValues((prev) => ({
      ...prev,
      preset: key,
      width: p?.width ?? prev.width,
      height: p?.height ?? prev.height,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="lt-name">Name</Label>
        <Input
          id="lt-name"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lt-desc">Description</Label>
        <Textarea
          id="lt-desc"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Preset</Label>
        <Select value={values.preset ?? NO_PRESET} onValueChange={applyPreset}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Custom size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PRESET}>Custom size</SelectItem>
            {presets.data?.map((p) => (
              <SelectItem key={p.key} value={p.key ?? ""}>
                {p.name} ({p.width} x {p.height} mm)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField
          id="lt-w"
          label="Width (mm)"
          value={values.width}
          onChange={(v) => set("width", v)}
        />
        <NumberField
          id="lt-h"
          label="Height (mm)"
          value={values.height}
          onChange={(v) => set("height", v)}
        />
        <NumberField
          id="lt-dpi"
          label="DPI"
          step="1"
          value={values.dpi}
          onChange={(v) => set("dpi", v)}
        />
        <NumberField
          id="lt-ox"
          label="Offset X"
          value={values.offsetX}
          onChange={(v) => set("offsetX", v)}
        />
        <NumberField
          id="lt-oy"
          label="Offset Y"
          value={values.offsetY}
          onChange={(v) => set("offsetY", v)}
        />
        <div className="space-y-1.5">
          <Label>Output format</Label>
          <Select
            value={values.outputFormat}
            onValueChange={(v) => v && set("outputFormat", v === "pdf" ? "pdf" : "png")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="lt-shared"
          checked={values.isShared}
          onCheckedChange={(v) => set("isShared", v)}
        />
        <Label htmlFor="lt-shared">Share with group</Label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!valid || pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
