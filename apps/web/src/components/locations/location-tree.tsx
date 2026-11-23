import { Link } from "@tanstack/react-router";
import { ChevronRight, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { RepoTreeItem } from "~/api/generated/model";
import { Button } from "~/components/ui/button";
import { cn } from "cn";

type LocationTreeProps = {
  nodes: RepoTreeItem[];
  onAddChild: (parent: RepoTreeItem) => void;
  onEdit: (node: RepoTreeItem) => void;
  onDelete: (node: RepoTreeItem) => void;
};

export function LocationTree({ nodes, ...actions }: LocationTreeProps) {
  return (
    <div className="rounded-xl border p-2">
      <ul className="space-y-0.5">
        {nodes.map((node) => (
          <LocationNode key={node.id} node={node} depth={0} {...actions} />
        ))}
      </ul>
    </div>
  );
}

function LocationNode({
  node,
  depth,
  onAddChild,
  onEdit,
  onDelete,
}: Omit<LocationTreeProps, "nodes"> & { node: RepoTreeItem; depth: number }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const children = node.children ?? [];
  const hasChildren = children.length > 0;

  return (
    <li>
      <div
        className="group flex items-center gap-1 rounded-lg py-1 pe-1 hover:bg-muted/60"
        style={{ paddingInlineStart: `${depth * 1.25 + 0.25}rem` }}
      >
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={expanded ? "Collapse" : "Expand"}
          aria-expanded={expanded}
          className={cn(!hasChildren && "invisible")}
          onClick={() => setExpanded((v) => !v)}
        >
          <ChevronRight className={cn("transition-transform", expanded && "rotate-90")} />
        </Button>
        <MapPin className="size-4 shrink-0 text-muted-foreground" />
        <Link
          to="/locations/$locationId"
          params={{ locationId: node.id ?? "" }}
          className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
        >
          {node.name}
        </Link>
        <div className="flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Add location under ${node.name}`}
            onClick={() => onAddChild(node)}
          >
            <Plus />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${node.name}`}
            onClick={() => onEdit(node)}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${node.name}`}
            onClick={() => onDelete(node)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      {hasChildren && expanded && (
        <ul className="space-y-0.5">
          {children.map((child) => (
            <LocationNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
