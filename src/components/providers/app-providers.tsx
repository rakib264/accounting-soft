"use client";

import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthHydrator } from "@/components/providers/auth-hydrator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/store/provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider>
        <TooltipProvider delayDuration={200}>
          <AuthHydrator>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </AuthHydrator>
        </TooltipProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}
