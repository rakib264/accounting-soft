import { z } from "zod";

import { mergePermissions } from "@/lib/auth/rbac";
import { ADMIN_DEFAULT_PERMISSIONS, DEFAULT_PERMISSIONS, SUPERADMIN_PERMISSIONS } from "@/lib/constants";
import { UserPermissions, UserRole } from "@/types/auth";

const crudPermissionSchema = z.object({
  view: z.boolean(),
  create: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean(),
});

const viewPermissionSchema = z.object({
  view: z.boolean(),
});

export const permissionsSchema: z.ZodType<UserPermissions> = z.object({
  manpowerSubcontract: crudPermissionSchema,
  trade: crudPermissionSchema,
  settings: viewPermissionSchema,
  userManagement: viewPermissionSchema,
  auditLogs: viewPermissionSchema,
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["superadmin", "admin", "editor"] satisfies UserRole[]),
  permissions: permissionsSchema.optional(),
  avatarUrl: z.string().url().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  role: z.enum(["superadmin", "admin", "editor"] satisfies UserRole[]).optional(),
  isActive: z.boolean().optional(),
  permissions: permissionsSchema.optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export function resolvePermissionsForRole(
  role: UserRole,
  permissions?: Partial<UserPermissions>,
): UserPermissions {
  if (role === "superadmin") {
    return SUPERADMIN_PERMISSIONS;
  }

  if (role === "editor") {
    return mergePermissions({
      ...DEFAULT_PERMISSIONS,
      manpowerSubcontract: {
        view: true,
        create: true,
        edit: false,
        delete: false,
      },
      trade: {
        view: true,
        create: true,
        edit: false,
        delete: false,
      },
    });
  }

  if (role === "admin") {
    return mergePermissions(permissions ?? ADMIN_DEFAULT_PERMISSIONS);
  }

  return mergePermissions(permissions);
}
