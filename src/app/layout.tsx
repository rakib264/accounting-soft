import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";

import { DEFAULT_THEME_ID } from "@/lib/themes/registry";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Accounting Business Manager",
  description: "Multi-partner accounting and business management system",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme={DEFAULT_THEME_ID}
      suppressHydrationWarning
      className={`${dmSans.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
