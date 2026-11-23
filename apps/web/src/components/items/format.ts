import { getEntityAttachmentGetUrl } from "~/api/generated/endpoints/entities-attachments/entities-attachments";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const compact = new Intl.NumberFormat("en-US");

export function formatCurrency(value?: number | null) {
  return currency.format(value ?? 0);
}

export function formatNumber(value?: number | null) {
  return compact.format(value ?? 0);
}

function isValidDate(value?: string | null): value is string {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getFullYear() > 1;
}

export function formatDate(value?: string | null) {
  if (!isValidDate(value)) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelative(value?: string | null) {
  if (!isValidDate(value)) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(value);
}

export function toDateInput(value?: string | null) {
  return isValidDate(value) ? new Date(value).toISOString().slice(0, 10) : "";
}

export function attachmentSrc(itemId: string, attachmentId?: string | null) {
  return attachmentId ? `/api${getEntityAttachmentGetUrl(itemId, attachmentId)}` : undefined;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
