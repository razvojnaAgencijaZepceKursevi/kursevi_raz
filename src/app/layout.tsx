import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ThemeRegistry from '@/theme/ThemeRegistry';
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ThemeRegistry>
          <QueryProvider>
            <AuthProvider>
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
