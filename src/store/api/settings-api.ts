import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQueryWithInterceptors } from "@/store/api/base-api";

type ApiResponse<T> = { success: boolean; data: T };

export type Settings = {
  vatPercent: number;
  currency: string;
  invoiceLabels: string[];
  updatedAt?: string;
};

export type InvoiceConfig = {
  vatPercent: number;
  currency: string;
  invoiceLabels: string[];
};

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: baseQueryWithInterceptors,
  tagTypes: ["Settings", "InvoiceConfig"],
  endpoints: (builder) => ({
    getSettings: builder.query<ApiResponse<{ settings: Settings }>, void>({
      query: () => "/settings",
      providesTags: ["Settings"],
    }),
    updateSettings: builder.mutation<ApiResponse<{ settings: Settings }>, Partial<Settings>>({
      query: (body) => ({ url: "/settings", method: "PATCH", body }),
      invalidatesTags: ["Settings", "InvoiceConfig"],
    }),
    getInvoiceConfig: builder.query<ApiResponse<InvoiceConfig>, void>({
      query: () => "/invoice-config",
      providesTags: ["InvoiceConfig"],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation, useGetInvoiceConfigQuery } = settingsApi;
