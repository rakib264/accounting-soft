"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { useMeQuery } from "@/store/api/auth-api";
import { setUser } from "@/store/features/auth-slice";

export function AuthHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { data, isError } = useMeQuery();

  useEffect(() => {
    if (data?.data.user) {
      dispatch(setUser(data.data.user));
    } else if (isError) {
      dispatch(setUser(null));
    }
  }, [data, dispatch, isError]);

  return children;
}
