import { Link } from "@tanstack/react-router";
import type { RepoEntitySummary } from "~/api/generated/model";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export function LocationChildrenTable({ entities }: { entities: RepoEntitySummary[] }) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="hidden md:table-cell">Tags</TableHead>
            <TableHead className="text-right">Qty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entities.map((entity) => {
            const id = entity.id ?? "";
            return (
              <TableRow key={id}>
                <TableCell className="font-medium">
                  {entity.entityType?.isLocation ? (
                    <Link
                      to="/locations/$locationId"
                      params={{ locationId: id }}
                      className="hover:underline"
                    >
                      {entity.name}
                    </Link>
                  ) : (
                    <Link to="/items/$itemId" params={{ itemId: id }} className="hover:underline">
                      {entity.name}
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {entity.entityType?.name ?? "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {entity.tags?.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{entity.quantity ?? "-"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
