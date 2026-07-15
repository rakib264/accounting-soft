import { Pagination } from "@/store/api/business-api";
import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQueryWithInterceptors } from "@/store/api/base-api";
import { UserPermissions, UserRole } from "@/types/auth";

type ApiResponse<T> = { success: boolean; data: T };

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  permissions: UserPermissions;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: baseQueryWithInterceptors,
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    getUsers: builder.query<
      ApiResponse<{ users: ManagedUser[]; pagination: Pagination }>,
      { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: "asc" | "desc" }
    >({
      query: (params) => ({ url: "/users", params }),
      providesTags: ["Users"],
    }),
    createUser: builder.mutation<
      ApiResponse<{ user: ManagedUser }>,
      { name: string; email: string; password: string; role: UserRole; permissions?: UserPermissions; avatarUrl?: string }
    >({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation<
      ApiResponse<{ user: ManagedUser }>,
      { id: string; name?: string; role?: UserRole; isActive?: boolean; permissions?: UserPermissions; avatarUrl?: string | null }
    >({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation<ApiResponse<{ deleted: boolean }>, string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } = usersApi;
