import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { plusJakartaSans } from "@/lib/fonts";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: 'Pipfolio — Gold Trading Journal',
  description: 'Track your XAU/USD trades and P&L',
  appleWebApp: {
    title: 'Pipfolio',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF8F3' },
    { media: '(prefers-color-scheme: dark)', color: '#15140F' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} min-h-screen antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
