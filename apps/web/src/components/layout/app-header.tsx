import { Search } from "lucide-react";
import { AppBreadcrumb } from "~/components/layout/app-breadcrumb";
import { UserMenu } from "~/components/layout/user-menu";
import { ModeToggle } from "~/components/mode-toggle";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <AppBreadcrumb />
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search items..." className="w-64 pl-8" />
        </div>
        <ModeToggle />
        <UserMenu email={email} />
      </div>
    </header>
  );
}
