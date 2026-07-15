"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";

import { hasPermission } from "@/lib/auth/rbac";
import { RootState } from "@/store";
import { PermissionAction, PermissionModule } from "@/types/auth";

export function usePermission(module: PermissionModule, action: PermissionAction) {
  const user = useSelector((state: RootState) => state.auth.user);

  return useMemo(() => {
    if (!user) return false;
    return hasPermission(user, module, action);
  }, [user, module, action]);
}

export function useAuthUser() {
  return useSelector((state: RootState) => state.auth.user);
}
