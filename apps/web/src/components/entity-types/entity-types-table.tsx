import { Pencil, Trash2 } from "lucide-react";
import type { RepoEntityTypeSummary } from "~/api/generated/model";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type EntityTypesTableProps = {
  entityTypes: RepoEntityTypeSummary[];
  onEdit: (entityType: RepoEntityTypeSummary) => void;
  onDelete: (entityType: RepoEntityTypeSummary) => void;
};

export function EntityTypesTable({ entityTypes, onEdit, onDelete }: EntityTypesTableProps) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead className="hidden md:table-cell">Default template</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entityTypes.map((type) => (
            <TableRow key={type.id}>
              <TableCell className="font-medium">{type.name}</TableCell>
              <TableCell>
                <Badge variant={type.isLocation ? "default" : "secondary"}>
                  {type.isLocation ? "Location" : "Item"}
                </Badge>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {type.defaultTemplate?.name || "-"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${type.name}`}
                    onClick={() => onEdit(type)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${type.name}`}
                    onClick={() => onDelete(type)}
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
