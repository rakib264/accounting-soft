import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQueryWithInterceptors } from "@/store/api/base-api";
import { AuthUser } from "@/types/auth";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

type LoginPayload = {
  email: string;
  password: string;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithInterceptors,
  tagTypes: ["Me"],
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<{ user: AuthUser }>, LoginPayload>({
      query: (payload) => ({
        url: "/auth/login",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Me"],
    }),
    logout: builder.mutation<ApiResponse<{ message: string }>, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Me"],
    }),
    me: builder.query<ApiResponse<{ user: AuthUser }>, void>({
      query: () => ({
        url: "/auth/me",
      }),
      providesTags: ["Me"],
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useMeQuery } = authApi;
