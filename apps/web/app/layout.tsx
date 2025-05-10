import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/provider/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import AuthProvider from "@/components/provider/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Amply",
  description:
    "Find and register EV charging stations on the Solana blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
              <div className="flex min-h-screen flex-col">
                <main className="flex-1">{children}</main>
              </div>
              <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
