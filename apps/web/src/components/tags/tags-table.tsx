import { Pencil, Trash2 } from "lucide-react";
import type { RepoTagSummary } from "~/api/generated/model";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type TagsTableProps = {
  tags: RepoTagSummary[];
  onEdit: (tag: RepoTagSummary) => void;
  onDelete: (tag: RepoTagSummary) => void;
};

export function TagsTable({ tags, onEdit, onDelete }: TagsTableProps) {
  const byId = new Map(tags.map((t) => [t.id, t]));
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => (
            <TableRow key={tag.id}>
              <TableCell>
                <div className="flex items-center gap-2 font-medium">
                  <span
                    className="size-3 shrink-0 rounded-full border"
                    style={{ backgroundColor: tag.color || undefined }}
                  />
                  {tag.name}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {tag.parentId ? (byId.get(tag.parentId)?.name ?? "-") : "-"}
              </TableCell>
              <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                {tag.description || "-"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${tag.name}`}
                    onClick={() => onEdit(tag)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${tag.name}`}
                    onClick={() => onDelete(tag)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
