import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "منصة الحديث الشريف التفاعلية",
  description: "منصة تعليمية لحفظ وضبط نطق الحديث الشريف — بروتوتايب",
  manifest: "/manifest.json",
};

export const viewport: Viewport = { themeColor: "#047857", width: "device-width", initialScale: 1 };

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
        </StoreProvider>
      </body>
    </html>
  );
}
