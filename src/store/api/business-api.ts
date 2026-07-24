import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQueryWithInterceptors } from "@/store/api/base-api";

type ApiResponse<T> = { success: boolean; data: T; message?: string };

export type Pagination = {
  page: number;
  limit: number;
  totalPages: number;
  totalDocs: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
};

export type Project = {
  id: string;
  name: string;
  details: string;
  imageUrl?: string;
  businessType: "manpower" | "subcontract" | "trade";
  totalInvoiced: number;
  totalExpenses: number;
  totalVatAmount?: number;
  totalReceived?: number;
  totalDue?: number;
  netIncome?: number;
  invoiceCount?: number;
  expenseCount?: number;
  receivedCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  id: string;
  projectId: string;
  projectName?: string;
  lineItems: Array<{ label: string; amount: number }>;
  lineItemSummary?: string;
  invoiceDate: string;
  vatPercent: number;
  vatAmount: number;
  subtotal: number;
  total: number;
  amountReceived?: number;
  amountDue?: number;
  attachments: string[];
  createdAt: string;
};

export type Expense = {
  id: string;
  projectId: string;
  projectName?: string;
  entries: Array<{ label: string; amount: number; details: string; date: string; attachments: string[] }>;
  totalAmount?: number;
  labelSummary?: string;
  createdAt: string;
};

export type ReceivedAmount = {
  id: string;
  projectId: string;
  projectName?: string;
  businessType?: "manpower" | "subcontract" | "trade";
  invoiceId: string;
  invoiceDate?: string;
  invoiceLabel?: string;
  invoiceTotal?: number;
  amount: number;
  receivedDate?: string | null;
  invoiceAmountReceived?: number;
  invoiceAmountDue?: number;
  createdAt: string;
  updatedAt?: string;
};

export type ReportSummary = {
  totalProjects: number;
  totalInvoices: number;
  totalRevenue?: number;
  totalInvoiceAmount?: number;
  totalVatAmount?: number;
  totalReceived?: number;
  totalDue?: number;
  totalExpenses: number;
  netIncome?: number;
  netProfit?: number;
  tradeCredit?: number;
  tradeDebit?: number;
};

export const businessApi = createApi({
  reducerPath: "businessApi",
  baseQuery: baseQueryWithInterceptors,
  tagTypes: ["Projects", "Invoices", "Expenses", "ReceivedAmounts", "Reports"],
  endpoints: (builder) => ({
    getProjects: builder.query<
      ApiResponse<{ projects: Project[]; pagination: Pagination }>,
      {
        businessType?: "manpower" | "subcontract" | "trade";
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      }
    >({
      query: (params) => ({ url: "/projects", params }),
      providesTags: ["Projects"],
    }),
    getProject: builder.query<ApiResponse<{ project: Project }>, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Projects", id }],
    }),
    createProject: builder.mutation<
      ApiResponse<{ project: Project }>,
      { name: string; details: string; imageUrl?: string; businessType: "manpower" | "subcontract" | "trade" }
    >({
      query: (body) => ({ url: "/projects", method: "POST", body }),
      invalidatesTags: ["Projects", "Reports"],
    }),
    updateProject: builder.mutation<ApiResponse<{ project: Project }>, { id: string; data: Partial<Project> }>({
      query: ({ id, data }) => ({ url: `/projects/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Projects", "Reports"],
    }),
    deleteProject: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
      invalidatesTags: ["Projects", "Reports"],
    }),
    getInvoices: builder.query<
      ApiResponse<{ invoices: Invoice[]; pagination: Pagination }>,
      {
        businessType?: "manpower" | "subcontract" | "trade";
        projectId?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      }
    >({
      query: (params) => ({ url: "/invoices", params }),
      providesTags: ["Invoices"],
    }),
    getProjectInvoices: builder.query<
      ApiResponse<{ invoices: Invoice[]; pagination: Pagination }>,
      { projectId: string; page?: number; limit?: number; sortBy?: string; sortOrder?: "asc" | "desc" }
    >({
      query: ({ projectId, ...params }) => ({ url: `/projects/${projectId}/invoices`, params }),
      providesTags: ["Invoices"],
    }),
    createInvoice: builder.mutation<
      ApiResponse<{ invoice: Invoice }>,
      { projectId: string; lineItems: Array<{ label: string; amount: number }>; invoiceDate: string; attachments?: string[] }
    >({
      query: ({ projectId, ...body }) => ({ url: `/projects/${projectId}/invoices`, method: "POST", body }),
      invalidatesTags: ["Invoices", "Projects", "Reports"],
    }),
    updateInvoice: builder.mutation<
      ApiResponse<{ invoice: Invoice }>,
      { id: string; lineItems?: Array<{ label: string; amount: number }>; invoiceDate?: string; attachments?: string[] }
    >({
      query: ({ id, ...body }) => ({ url: `/invoices/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Invoices", "Projects", "Reports"],
    }),
    deleteInvoice: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (id) => ({ url: `/invoices/${id}`, method: "DELETE" }),
      invalidatesTags: ["Invoices", "Projects", "Reports"],
    }),
    getExpenses: builder.query<
      ApiResponse<{ expenses: Expense[]; pagination: Pagination }>,
      {
        businessType?: "manpower" | "subcontract" | "trade";
        projectId?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      }
    >({
      query: (params) => ({ url: "/expenses", params }),
      providesTags: ["Expenses"],
    }),
    getProjectExpenses: builder.query<
      ApiResponse<{ expenses: Expense[]; pagination: Pagination }>,
      { projectId: string; page?: number; limit?: number; sortBy?: string; sortOrder?: "asc" | "desc" }
    >({
      query: ({ projectId, ...params }) => ({ url: `/projects/${projectId}/expenses`, params }),
      providesTags: ["Expenses"],
    }),
    createExpense: builder.mutation<
      ApiResponse<{ expense: Expense }>,
      {
        projectId: string;
        entries: Array<{ label: string; amount: number; details: string; date: string; attachments?: string[] }>;
      }
    >({
      query: ({ projectId, ...body }) => ({ url: `/projects/${projectId}/expenses`, method: "POST", body }),
      invalidatesTags: ["Expenses", "Projects", "Reports"],
    }),
    updateExpense: builder.mutation<
      ApiResponse<{ expense: Expense }>,
      {
        id: string;
        entries?: Array<{ label: string; amount: number; details: string; date: string; attachments?: string[] }>;
      }
    >({
      query: ({ id, ...body }) => ({ url: `/expenses/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Expenses", "Projects", "Reports"],
    }),
    deleteExpense: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (id) => ({ url: `/expenses/${id}`, method: "DELETE" }),
      invalidatesTags: ["Expenses", "Projects", "Reports"],
    }),
    getProjectReceivedAmounts: builder.query<
      ApiResponse<{ receivedAmounts: ReceivedAmount[]; pagination: Pagination }>,
      { projectId: string; invoiceId?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: "asc" | "desc" }
    >({
      query: ({ projectId, ...params }) => ({ url: `/projects/${projectId}/received-amounts`, params }),
      providesTags: ["ReceivedAmounts"],
    }),
    getReceivedAmounts: builder.query<
      ApiResponse<{ receivedAmounts: ReceivedAmount[]; pagination: Pagination }>,
      {
        businessType?: "manpower" | "subcontract" | "trade";
        projectId?: string;
        invoiceId?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      }
    >({
      query: (params) => ({ url: "/received-amounts", params }),
      providesTags: ["ReceivedAmounts"],
    }),
    createReceivedAmount: builder.mutation<
      ApiResponse<{ receivedAmount: ReceivedAmount }>,
      { projectId: string; invoiceId: string; amount: number; receivedDate?: string | null }
    >({
      query: ({ projectId, ...body }) => ({ url: `/projects/${projectId}/received-amounts`, method: "POST", body }),
      invalidatesTags: ["ReceivedAmounts", "Invoices", "Projects", "Reports"],
    }),
    updateReceivedAmount: builder.mutation<
      ApiResponse<{ receivedAmount: ReceivedAmount }>,
      { id: string; invoiceId?: string; amount?: number; receivedDate?: string | null }
    >({
      query: ({ id, ...body }) => ({ url: `/received-amounts/${id}`, method: "PATCH", body }),
      invalidatesTags: ["ReceivedAmounts", "Invoices", "Projects", "Reports"],
    }),
    deleteReceivedAmount: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (id) => ({ url: `/received-amounts/${id}`, method: "DELETE" }),
      invalidatesTags: ["ReceivedAmounts", "Invoices", "Projects", "Reports"],
    }),
    getDashboardReport: builder.query<
      ApiResponse<{ summary: ReportSummary; monthlyTrend: Array<{ label: string; revenue: number; expenses: number }> }>,
      void
    >({
      query: () => "/reports",
      providesTags: ["Reports"],
    }),
    getModuleReport: builder.query<
      ApiResponse<{ summary: ReportSummary }>,
      { businessType?: "manpower" | "subcontract" | "trade"; projectId?: string; from?: string; to?: string }
    >({
      query: (params) => ({ url: "/reports", params: { ...params, type: "module" } }),
      providesTags: ["Reports"],
    }),
    uploadFiles: builder.mutation<ApiResponse<{ urls: string[] }>, { files: File[]; folder: string }>({
      queryFn: async ({ files, folder }, _api, _extra, baseQuery) => {
        const formData = new FormData();
        formData.set("folder", folder);
        files.forEach((file) => formData.append("files", file));

        const result = await baseQuery({
          url: "/uploads",
          method: "POST",
          body: formData,
        });

        if (result.error) return { error: result.error };
        return { data: result.data as ApiResponse<{ urls: string[] }> };
      },
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetInvoicesQuery,
  useGetProjectInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useGetExpensesQuery,
  useGetProjectExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetProjectReceivedAmountsQuery,
  useGetReceivedAmountsQuery,
  useCreateReceivedAmountMutation,
  useUpdateReceivedAmountMutation,
  useDeleteReceivedAmountMutation,
  useGetDashboardReportQuery,
  useGetModuleReportQuery,
  useUploadFilesMutation,
} = businessApi;
