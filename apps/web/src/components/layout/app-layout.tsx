import type { ReactNode } from "react";
import { AppHeader } from "~/components/layout/app-header";
import { AppSidebar } from "~/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { TooltipProvider } from "~/components/ui/tooltip";

export function AppLayout({ email, children }: { email: string; children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader email={email} />
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
