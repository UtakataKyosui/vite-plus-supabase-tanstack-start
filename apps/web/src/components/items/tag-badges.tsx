import type { RepoTagSummary } from "~/api/generated/model";
import { Badge } from "~/components/ui/badge";

export function TagBadges({ tags, max = 3 }: { tags?: RepoTagSummary[]; max?: number }) {
  if (!tags?.length) return <span className="text-xs text-muted-foreground">—</span>;
  const shown = tags.slice(0, max);
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((tag) => (
        <Badge key={tag.id} variant="secondary">
          {tag.name}
        </Badge>
      ))}
      {tags.length > max && <Badge variant="outline">+{tags.length - max}</Badge>}
    </div>
  );
}
