"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { usePermission } from "@/hooks/use-permission";
import { PermissionAction, PermissionModule } from "@/types/auth";

type PermissionGateProps = {
  module: PermissionModule;
  action: PermissionAction;
  children: React.ReactNode;
};

export function PermissionGate({ module, action, children }: PermissionGateProps) {
  const allowed = usePermission(module, action);
  const router = useRouter();

  useEffect(() => {
    if (!allowed) {
      router.replace("/dashboard");
    }
  }, [allowed, router]);

  if (!allowed) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <h2 className="text-lg font-semibold text-foreground">Access denied</h2>
        <p className="mt-2 text-sm text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
}
