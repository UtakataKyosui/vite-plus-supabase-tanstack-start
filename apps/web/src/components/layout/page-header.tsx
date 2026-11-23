import type { ReactNode } from "react";
import { Heading } from "~/components/ui/heading";
import { Text } from "~/components/ui/text";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <Heading level={3}>{title}</Heading>
        {description && <Text tone="muted">{description}</Text>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
