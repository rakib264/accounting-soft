"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { z } from "zod";

import { FormField, fieldError } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { trimmedEmail, trimmedRequired } from "@/lib/validation/common";
import { showSuccess } from "@/lib/toast";
import { useLoginMutation } from "@/store/api/auth-api";
import { setUser } from "@/store/features/auth-slice";

const loginSchema = z.object({
  email: trimmedEmail,
  password: trimmedRequired("Password"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: LoginForm) {
    try {
      const result = await login(values).unwrap();
      dispatch(setUser(result.data.user));
      showSuccess("Signed in successfully.");
      form.reset();
      router.push(searchParams.get("next") || "/dashboard");
    } catch {
      /* Backend error toast via RTK */
    }
  }

  const loading = isLoading || isSubmitting;

  return (
    <div className="login-canvas flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-[400px]">
        {/* Brand — compact, centered */}
        <header className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Business Manager</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Accounting &amp; business management for manpower, sub-contract, and trade.
          </p>
        </header>

        {/* Sign-in card */}
        <Card className="border-border/80 bg-card shadow-[var(--shadow-soft)]">
          <CardContent className="p-6 sm:p-8">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Sign in</h2>
            <p className="mb-6 text-sm text-muted-foreground">Use your work email and password.</p>

            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <FormField label="Email" htmlFor="email" required error={fieldError(errors, "email")}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  aria-invalid={Boolean(errors.email)}
                  {...form.register("email")}
                />
              </FormField>
              <FormField label="Password" htmlFor="password" required error={fieldError(errors, "password")}>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                  {...form.register("password")}
                />
              </FormField>
              <SubmitButton className="mt-2 w-full" loading={loading} loadingText="Signing in...">
                Sign in
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secure access for authorized team members only.
        </p>
      </div>
    </div>
  );
}
