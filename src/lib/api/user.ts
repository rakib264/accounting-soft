import { Types } from "mongoose";

import { mergePermissions } from "@/lib/auth/rbac";
import { AuthUser } from "@/types/auth";

type UserLike = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: AuthUser["role"];
  isActive: boolean;
  permissions: AuthUser["permissions"];
};

export function toAuthUser(user: UserLike): AuthUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    permissions: mergePermissions(user.permissions),
  };
}
