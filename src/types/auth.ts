export type UserRole = "superadmin" | "admin" | "editor";

export type CrudPermission = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

export type ViewPermission = {
  view: boolean;
};

export type UserPermissions = {
  manpowerSubcontract: CrudPermission;
  trade: CrudPermission;
  settings: ViewPermission;
  userManagement: ViewPermission;
  auditLogs: ViewPermission;
};

export type PermissionModule = keyof UserPermissions;

export type PermissionAction = "view" | "create" | "edit" | "delete";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  permissions: UserPermissions;
};
