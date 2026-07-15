import mongoose, { HydratedDocument, Model, Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

import { DEFAULT_PERMISSIONS } from "@/lib/constants";
import { UserPermissions, UserRole } from "@/types/auth";

type User = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserDocument = HydratedDocument<User>;

type UserModel = Model<User> & {
  paginate: (query?: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
};

const crudPermissionSchema = new Schema(
  {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false },
);

const viewPermissionSchema = new Schema(
  {
    view: { type: Boolean, default: false },
  },
  { _id: false },
);

const permissionsSchema = new Schema(
  {
    manpowerSubcontract: { type: crudPermissionSchema, default: DEFAULT_PERMISSIONS.manpowerSubcontract },
    trade: { type: crudPermissionSchema, default: DEFAULT_PERMISSIONS.trade },
    settings: { type: viewPermissionSchema, default: DEFAULT_PERMISSIONS.settings },
    userManagement: { type: viewPermissionSchema, default: DEFAULT_PERMISSIONS.userManagement },
    auditLogs: { type: viewPermissionSchema, default: DEFAULT_PERMISSIONS.auditLogs },
  },
  { _id: false },
);

const userSchema = new Schema<User, UserModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "editor"] satisfies UserRole[],
      required: true,
      default: "editor",
    },
    permissions: {
      type: permissionsSchema,
      default: DEFAULT_PERMISSIONS,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatarUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.plugin(mongoosePaginate);

export const UserModel = (mongoose.models.User as UserModel) || mongoose.model<User, UserModel>("User", userSchema);
