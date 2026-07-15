import { UserPermissions } from "@/types/auth";

export const AUTH_COOKIE_NAME = "accounting_session";

export const PERMISSION_DENIED_MESSAGE = "You do not have permission to perform this action.";

export const DEFAULT_PERMISSIONS: UserPermissions = {
  manpowerSubcontract: {
    view: false,
    create: false,
    edit: false,
    delete: false,
  },
  trade: {
    view: false,
    create: false,
    edit: false,
    delete: false,
  },
  settings: {
    view: false,
  },
  userManagement: {
    view: false,
  },
  auditLogs: {
    view: false,
  },
};

export const ADMIN_DEFAULT_PERMISSIONS: UserPermissions = {
  manpowerSubcontract: {
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  trade: {
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  settings: {
    view: false,
  },
  userManagement: {
    view: false,
  },
  auditLogs: {
    view: false,
  },
};

export const SUPERADMIN_PERMISSIONS: UserPermissions = {
  manpowerSubcontract: {
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  trade: {
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  settings: {
    view: true,
  },
  userManagement: {
    view: true,
  },
  auditLogs: {
    view: true,
  },
};
