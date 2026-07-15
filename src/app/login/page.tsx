import { Suspense } from "react";

import LoginPage from "./page.client";

function LoginFallback() {
  return (
    <div className="login-canvas flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="mx-auto h-11 w-11 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted/80" />
      </div>
    </div>
  );
}

export default function LoginRoutePage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPage />
    </Suspense>
  );
}
