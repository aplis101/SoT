import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import AppShell from "@/components/AppShell";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "منصة الحديث الشريف التفاعلية",
  description: "منصة تعليمية لحفظ وضبط نطق الحديث الشريف بتسجيلات الطلاب",
  manifest: "/manifest.json",
  applicationName: "الحديث",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "الحديث" },
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "منصة الحديث الشريف التفاعلية",
    description: "استمع، سجّل، وأتقن ضبط نطق الحديث مع زملائك.",
    images: ["/icons/og.png"],
    locale: "ar",
    type: "website",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#047857",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* الخطوط عبر <link> لا next/font — يسمح بالبناء دون اتصال، ويحمّلها المتصفح عند التشغيل.
            المرجع: 12-design-system.md §4 (Amiri للمتون، IBM Plex Sans Arabic للواجهة) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <StoreProvider>
          <AppShell>{children}</AppShell>
          <PWARegister />
        </StoreProvider>
      </body>
    </html>
  );
}
