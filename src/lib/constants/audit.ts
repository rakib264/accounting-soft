export const AUDIT_MODULES = [
  { value: "auth", label: "Auth" },
  { value: "manpowerSubcontract", label: "Manpower & Subcontract" },
  { value: "trade", label: "Trade" },
  { value: "settings", label: "Settings" },
  { value: "userManagement", label: "User Management" },
  { value: "uploads", label: "Uploads" },
  { value: "auditLogs", label: "Audit Logs" },
] as const;

export const AUDIT_ACTIONS = [
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
] as const;

export const AUDIT_ROLES = [
  { value: "superadmin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
] as const;
