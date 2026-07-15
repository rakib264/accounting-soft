import { configureStore } from "@reduxjs/toolkit";

import { authApi } from "@/store/api/auth-api";
import { auditApi } from "@/store/api/audit-api";
import { businessApi } from "@/store/api/business-api";
import { settingsApi } from "@/store/api/settings-api";
import { tradeApi } from "@/store/api/trade-api";
import { usersApi } from "@/store/api/users-api";
import { authReducer } from "@/store/features/auth-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [businessApi.reducerPath]: businessApi.reducer,
    [tradeApi.reducerPath]: tradeApi.reducer,
    [auditApi.reducerPath]: auditApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      settingsApi.middleware,
      usersApi.middleware,
      businessApi.middleware,
      tradeApi.middleware,
      auditApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
