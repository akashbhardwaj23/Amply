import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/navbar";
import Script from "next/script";
import { MapContextProvider } from "./context/MapContext";

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MapContextProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
            <Toaster />
          </MapContextProvider>
        </ThemeProvider>
        <Script
          src={`https://apis.mappls.com/advancedmaps/api/${process.env.NEXT_PUBLIC_MAPPLES_TOKEN}/map_sdk?v=3.0&layer=vector`}
        />
      </body>
    </html>
  );
}
