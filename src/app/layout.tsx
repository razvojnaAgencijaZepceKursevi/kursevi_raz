import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import './globals.css';
import ThemeRegistry from '@/theme/ThemeRegistry';
import ThemeSync from '@/theme/ThemeSync';
import QueryProvider from '@/lib/query/QueryProvider';
import AuthProvider from '@/components/AuthProvider';
import ToastHost from '@/components/feedback/ToastHost';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kursevi',
  description: 'Online courses platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bs"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/*
          Must be the first child of <body>, and must match the theme's
          `colorSchemeSelector: 'class'`.

          It writes a tiny blocking script that reads the saved mode and stamps
          the class on <html> *before* the first paint. Without it a user on the
          dark scheme sees a white flash on every full page load, because the
          server has no way to know their choice — it lives in localStorage.

          `suppressHydrationWarning` on <html> goes with it: the script mutates
          the element before React hydrates, so the server and client markup
          legitimately disagree on that one attribute.
        */}
        <InitColorSchemeScript defaultMode="system" attribute="class" />
        <ThemeRegistry>
          <QueryProvider>
            <AuthProvider>
              {/* Applies the signed-in user's saved scheme once it loads.
                  Renders nothing; needs both the theme and the query client. */}
              <ThemeSync />
              {children}
              {/* Mounted once, app-wide. Anything can raise a toast from
                  anywhere via `toast.success(...)` — see @/store/useToastStore. */}
              <ToastHost />
            </AuthProvider>
          </QueryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
