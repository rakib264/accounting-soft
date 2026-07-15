"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar();

  return (
    <div className="page-canvas min-h-dvh">
      <AppSidebar />
      <main
        style={{
          paddingLeft: expanded ? "var(--sidebar-width)" : "var(--sidebar-width-collapsed)",
        }}
        className={cn("min-h-dvh transition-[padding-left] duration-300 ease-out")}
      >
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
