import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/provider/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from '@/components/provider/auth-provider';
import { LoadingProvider } from './context/LoadingContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Amply',
  description:
    'Find and register EV charging stations on the Solana blockchain',
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
          <LoadingProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen flex-col bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
              <main className="flex-1">{children}</main>
            </div>
            <Toaster />
          </ThemeProvider>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
