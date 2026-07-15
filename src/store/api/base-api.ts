import { showError } from "@/lib/toast";
import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import { CSRF_HEADER_NAME } from "@/lib/csrf";
import { getClientCsrfToken } from "@/lib/csrf-client";
import { clearUser } from "@/store/features/auth-slice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
  prepareHeaders: (headers) => {
    const csrfToken = getClientCsrfToken();
    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
    return headers;
  },
});

function getErrorMessage(error: FetchBaseQueryError) {
  if ("data" in error && error.data && typeof error.data === "object" && "message" in error.data) {
    return String(error.data.message);
  }

  if (error.status === "FETCH_ERROR") {
    return "Network error. Please check your connection.";
  }

  return "Something went wrong. Please try again.";
}

const baseQueryWithInterceptors: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    if (result.error.status === 401) {
      api.dispatch(clearUser());
    } else {
      showError(getErrorMessage(result.error));
    }
  }

  return result;
};

export { baseQueryWithInterceptors };
