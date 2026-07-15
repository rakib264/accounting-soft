"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  Sparkles,
  Users,
  Warehouse,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthUser, usePermission } from "@/hooks/use-permission";
import { useLogoutMutation } from "@/store/api/auth-api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Man-power & Subcontract",
    icon: Building2,
    children: [
      {
        href: "/manpower-subcontract/collective",
        label: "Collective Reporting",
      },
      { href: "/manpower-subcontract/subcontract", label: "Sub-contract" },
      { href: "/manpower-subcontract/manpower", label: "Man-power" },
    ],
  },
  { href: "/trade", label: "Trade", icon: Warehouse },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    permission: "settings" as const,
  },
  {
    href: "/users",
    label: "User Management",
    icon: Users,
    permission: "userManagement" as const,
  },
  {
    href: "/audit-logs",
    label: "Audit Logs",
    icon: Shield,
    permission: "auditLogs" as const,
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppSidebar() {
  const pathname = usePathname();
  const user = useAuthUser();
  const [logout] = useLogoutMutation();
  const { expanded, toggle } = useSidebar();
  const [manpowerOpen, setManpowerOpen] = useState(true);

  const canViewManpower = usePermission("manpowerSubcontract", "view");
  const canViewTrade = usePermission("trade", "view");
  const canViewSettings = usePermission("settings", "view");
  const canViewUsers = usePermission("userManagement", "view");
  const canViewAudit = usePermission("auditLogs", "view");

  const permissionMap = useMemo(
    () => ({
      settings: canViewSettings,
      userManagement: canViewUsers,
      auditLogs: canViewAudit,
    }),
    [canViewAudit, canViewSettings, canViewUsers],
  );

  const manpowerActive = [
    "/manpower-subcontract/collective",
    "/manpower-subcontract/subcontract",
    "/manpower-subcontract/manpower",
  ].some((href) => pathname.startsWith(href));

  return (
    <aside
      style={{
        width: expanded
          ? "var(--sidebar-width)"
          : "var(--sidebar-width-collapsed)",
      }}
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top_left,var(--canvas-glow-primary),transparent_55%)]",
      )}
    >
      {/* Brand */}
      <div className="relative z-10 flex shrink-0 items-center gap-3 border-b border-sidebar-border px-4 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30">
          <Sparkles className="h-5 w-5 text-sidebar-accent-foreground" />
        </div>
        {expanded && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">
              Accounting
            </p>
            <p className="truncate text-white font-bold tracking-tight">
              Business Manager
            </p>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-sidebar-muted hover:bg-[var(--sidebar-hover)] hover:text-sidebar-foreground"
          onClick={toggle}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation — only as tall as its content */}
      <nav className="relative z-10 shrink-0 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          if ("children" in item) {
            if (!canViewManpower) return null;

            const children = item.children ?? [];

            if (!expanded) {
              return (
                <Link
                  key={item.label}
                  href="/manpower-subcontract/collective"
                  title={item.label}
                  className={cn(
                    "flex items-center justify-center rounded-xl px-3 py-2.5 transition-colors",
                    manpowerActive
                      ? "bg-primary/15 text-sidebar-accent-foreground ring-1 ring-primary/25"
                      : "text-sidebar-muted hover:bg-[var(--sidebar-hover)] hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                </Link>
              );
            }

            return (
              <div key={item.label} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => expanded && setManpowerOpen((value) => !value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    manpowerActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-muted hover:bg-[var(--sidebar-hover)] hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {expanded && (
                    <>
                      <span className="flex-1 truncate text-left">
                        {item.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform",
                          manpowerOpen && "rotate-180",
                        )}
                      />
                    </>
                  )}
                </button>

                {expanded && manpowerOpen && (
                  <div className="ml-3 space-y-0.5 border-l border-sidebar-border pl-3">
                    {children.map((child) => {
                      const active =
                        pathname === child.href ||
                        pathname.startsWith(`${child.href}/`);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm transition-colors",
                            active
                              ? "bg-primary/15 font-semibold text-sidebar-accent-foreground ring-1 ring-primary/25"
                              : "text-sidebar-muted hover:bg-[var(--sidebar-hover)] hover:text-sidebar-foreground",
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (item.href === "/trade" && !canViewTrade) return null;
          if (item.permission && !permissionMap[item.permission]) return null;

          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={!expanded ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-sidebar-accent-foreground ring-1 ring-primary/25"
                  : "text-sidebar-muted hover:bg-[var(--sidebar-hover)] hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {expanded && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer pinned to bottom */}
      <div className="relative z-10 mt-auto shrink-0 border-t border-sidebar-border p-3">
        {user && (
          <div
            className={cn(
              "mb-2 flex items-center gap-3 rounded-xl bg-[var(--sidebar-hover)] p-3 ring-1 ring-sidebar-border",
              !expanded && "justify-center p-2",
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/25 text-xs font-bold text-sidebar-accent-foreground ring-2 ring-primary/30">
              {initials(user.name)}
            </div>
            {expanded && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs capitalize text-sidebar-muted">
                  {user.role}
                </p>
              </div>
            )}
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "w-full text-sidebar-muted hover:bg-[var(--sidebar-hover)] hover:text-sidebar-foreground",
            expanded ? "justify-start gap-3 px-3" : "justify-center px-0",
          )}
          onClick={() => logout().then(() => (window.location.href = "/login"))}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {expanded && <span>Sign out</span>}
        </Button>
      </div>
    </aside>
  );
}
