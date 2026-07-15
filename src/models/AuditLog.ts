import mongoose, { HydratedDocument, Model, Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

import { UserRole } from "@/types/auth";

type AuditAction = "create" | "update" | "delete" | "login" | "logout";

type AuditLog = {
  userId: string;
  userName: string;
  role: UserRole;
  action: AuditAction;
  module: string;
  entityType: string;
  entityId?: string;
  changes?: {
    before?: unknown;
    after?: unknown;
  };
  timestamp: Date;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuditLogDocument = HydratedDocument<AuditLog>;

type AuditLogModel = Model<AuditLog> & {
  paginate: (query?: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
};

const auditLogSchema = new Schema<AuditLog, AuditLogModel>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    role: {
      type: String,
      enum: ["superadmin", "admin", "editor"] satisfies UserRole[],
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "delete", "login", "logout"] satisfies AuditAction[],
      required: true,
      index: true,
    },
    module: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String },
    changes: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
    },
    timestamp: { type: Date, required: true, default: () => new Date(), index: true },
    ipAddress: { type: String },
  },
  { timestamps: true },
);

auditLogSchema.plugin(mongoosePaginate);

export const AuditLogModel =
  (mongoose.models.AuditLog as AuditLogModel) || mongoose.model<AuditLog, AuditLogModel>("AuditLog", auditLogSchema);
