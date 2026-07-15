import { DEFAULT_PERMISSIONS } from "@/lib/constants";
import { AuthUser, PermissionAction, PermissionModule, UserPermissions } from "@/types/auth";

export function mergePermissions(partialPermissions?: Partial<UserPermissions>): UserPermissions {
  return {
    manpowerSubcontract: {
      ...DEFAULT_PERMISSIONS.manpowerSubcontract,
      ...partialPermissions?.manpowerSubcontract,
    },
    trade: {
      ...DEFAULT_PERMISSIONS.trade,
      ...partialPermissions?.trade,
    },
    settings: {
      ...DEFAULT_PERMISSIONS.settings,
      ...partialPermissions?.settings,
    },
    userManagement: {
      ...DEFAULT_PERMISSIONS.userManagement,
      ...partialPermissions?.userManagement,
    },
    auditLogs: {
      ...DEFAULT_PERMISSIONS.auditLogs,
      ...partialPermissions?.auditLogs,
    },
  };
}

export function hasPermission(
  user: Pick<AuthUser, "role" | "permissions" | "isActive">,
  module: PermissionModule,
  action: PermissionAction,
) {
  if (!user.isActive) {
    return false;
  }

  if (user.role === "superadmin") {
    return true;
  }

  const mergedPermissions = mergePermissions(user.permissions);
  const modulePermission = mergedPermissions[module];

  if (!modulePermission) {
    return false;
  }

  if (!(action in modulePermission)) {
    return false;
  }

  return Boolean(modulePermission[action as keyof typeof modulePermission]);
}
