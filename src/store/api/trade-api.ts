import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQueryWithInterceptors } from "@/store/api/base-api";
import { Pagination } from "@/store/api/business-api";

type ApiResponse<T> = { success: boolean; data: T; message?: string };

export type TradeTransaction = {
  id: string;
  sourceFile: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
  createdAt: string;
};

export type ParsedTradeFile = {
  fileName: string;
  transactions: Array<{
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    reference?: string;
    rawExtractedData?: Record<string, unknown>;
  }>;
};

export const tradeApi = createApi({
  reducerPath: "tradeApi",
  baseQuery: baseQueryWithInterceptors,
  tagTypes: ["Trade"],
  endpoints: (builder) => ({
    parseTradeFiles: builder.mutation<ApiResponse<{ files: ParsedTradeFile[] }>, File[]>({
      queryFn: async (files, _api, _extra, baseQuery) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        const result = await baseQuery({
          url: "/trade/parse",
          method: "POST",
          body: formData,
        });

        if (result.error) return { error: result.error };
        return { data: result.data as ApiResponse<{ files: ParsedTradeFile[] }> };
      },
    }),
    getTradeTransactions: builder.query<
      ApiResponse<{
        transactions: TradeTransaction[];
        summary: { totalCredit: number; totalDebit: number; netBalance: number };
        pagination: Pagination;
      }>,
      { from?: string; to?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/trade/transactions", params }),
      providesTags: ["Trade"],
    }),
    commitTradeTransactions: builder.mutation<
      ApiResponse<{ count: number }>,
      { sourceFile: string; transactions: ParsedTradeFile["transactions"] }
    >({
      query: (body) => ({ url: "/trade/transactions", method: "POST", body }),
      invalidatesTags: ["Trade"],
    }),
  }),
});

export const { useParseTradeFilesMutation, useGetTradeTransactionsQuery, useCommitTradeTransactionsMutation } =
  tradeApi;
