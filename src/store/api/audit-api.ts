import { Pagination } from "@/store/api/business-api";
import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQueryWithInterceptors } from "@/store/api/base-api";

type ApiResponse<T> = { success: boolean; data: T };

export type AuditLogEntry = {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  module: string;
  entityType: string;
  entityId?: string;
  changes?: { before?: unknown; after?: unknown };
  timestamp: string;
  ipAddress?: string;
};

export const auditApi = createApi({
  reducerPath: "auditApi",
  baseQuery: baseQueryWithInterceptors,
  tagTypes: ["AuditLogs"],
  endpoints: (builder) => ({
    getAuditLogs: builder.query<
      ApiResponse<{ logs: AuditLogEntry[]; pagination: Pagination }>,
      {
        userId?: string;
        email?: string;
        role?: string;
        module?: string;
        action?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      }
    >({
      query: (params) => ({ url: "/audit-logs", params }),
      providesTags: ["AuditLogs"],
    }),
    deleteAuditLog: builder.mutation<ApiResponse<{ deleted: boolean }>, string>({
      query: (id) => ({ url: `/audit-logs/${id}`, method: "DELETE" }),
      invalidatesTags: ["AuditLogs"],
    }),
  }),
});

export const { useGetAuditLogsQuery, useDeleteAuditLogMutation } = auditApi;
