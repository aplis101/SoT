"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { EmptyState } from "@/components/ui";

const LINKS = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/reports", label: "بلاغات الصوت" },
  { href: "/admin/content-reports", label: "بلاغات المحتوى" },
  { href: "/admin/settings", label: "الإعدادات" },
];

/** PAGE-007 — حارس الصلاحية على مستوى المسار (يقابل فحص is_admin() الخادمي) */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, me } = useStore();
  const pathname = usePathname();
  if (!me) return null;
  if (!isAdmin) {
    return <EmptyState icon="🔒" title="غير مصرّح" hint="هذه الصفحة مقصورة على مشرف المادة." />;
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-stone-900">لوحة تحكم المشرف</h1>
      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${pathname === l.href ? "bg-white text-primary shadow-sm" : "text-stone-600 hover:text-stone-900"}`}>
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
