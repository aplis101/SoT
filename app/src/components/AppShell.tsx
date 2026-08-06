"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { IS_PLACEHOLDER_CONFIG, DATA_SOURCE } from "@/lib/config";
import LangSwitcher from "./LangSwitcher";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { state, dispatch, me, isAdmin } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  // حارس المصادقة (UC-001) — كل الصفحات محمية عدا /login
  // (رابط العرض ?as= يُعالَج في StoreProvider بعد تحميل الحالة المحفوظة)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("as=")) return;
    if (pathname.startsWith("/auth/")) return;   // صفحة العودة من Google تتولّى نفسها
    if (!state.sessionUserId && pathname !== "/login") router.replace("/login");
    if (state.sessionUserId && pathname === "/login") router.replace("/");
  }, [state.sessionUserId, pathname, router]);

  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_TOAST" }), 3200);
    return () => clearTimeout(t);
  }, [state.toast, dispatch]);

  const onLogin = pathname === "/login";

  return (
    <div className="min-h-dvh">
      {IS_PLACEHOLDER_CONFIG && (
        <div className="bg-amber-100 px-4 py-2 text-center text-[13px] text-amber-900">
          ⚙️ وضع البروتوتايب — مصدر البيانات: <b>{DATA_SOURCE}</b>. مفاتيح Supabase ما تزال تنكرية؛ استبدلها في <code className="latin">.env.local</code> للربط الحقيقي.
        </div>
      )}

      {!onLogin && me && (
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            {/* العلامة نفسها في الترويسة وعلى شاشة الهاتف — الرمز ☾ كان يختلف
                شكله بين الأجهزة لأنه محرف لا رسم. SVG واحد يضمن أن ما يراه
                الطالب في المتصفح هو ما يراه على أيقونة التطبيق. */}
            <Link href="/" className="flex items-center gap-2 font-bold text-primary" aria-label="منصة الحديث — الرئيسية">
              <svg viewBox="0 0 512 512" className="h-7 w-7" aria-hidden>
                <mask id="hdr-crescent">
                  <circle cx="196" cy="256" r="140" fill="#fff" />
                  <circle cx="250" cy="240" r="130" fill="#000" />
                </mask>
                <rect width="512" height="512" rx="96" fill="currentColor" />
                <rect width="512" height="512" fill="#ECFDF5" mask="url(#hdr-crescent)" />
                <g fill="none" stroke="#6EE7B7" strokeLinecap="round">
                  <path d="M361.6 187.6 A92 92 0 0 1 361.6 324.4" strokeWidth="20" opacity="0.92" />
                  <path d="M388.3 157.9 A132 132 0 0 1 388.3 354.1" strokeWidth="17" opacity="0.69" />
                  <path d="M415.1 128.2 A172 172 0 0 1 415.1 383.8" strokeWidth="14" opacity="0.45" />
                </g>
              </svg>
              <span className="text-[15px]">منصة الحديث</span>
            </Link>
            <nav className="mr-auto flex items-center gap-1 text-sm">
              <Link href="/" className={`rounded-lg px-3 py-1.5 ${pathname === "/" ? "bg-primary-soft text-primary" : "text-stone-600 hover:bg-stone-100"}`}>المكتبة</Link>
              {/* [F010] البحث في مقدمة التنقل — لا معنى لـ٣٥ ألف حديث بلا وصول إليها */}
              <Link href="/search" aria-label="البحث في الأحاديث" className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${pathname === "/search" ? "bg-primary-soft text-primary" : "text-stone-600 hover:bg-stone-100"}`}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                البحث
              </Link>
              <Link href="/profile" className={`rounded-lg px-3 py-1.5 ${pathname === "/profile" ? "bg-primary-soft text-primary" : "text-stone-600 hover:bg-stone-100"}`}>ملفي</Link>
              {isAdmin && (
                <Link href="/admin" className={`rounded-lg px-3 py-1.5 ${pathname.startsWith("/admin") ? "bg-primary-soft text-primary" : "text-stone-600 hover:bg-stone-100"}`}>
                  الإشراف
                </Link>
              )}
            </nav>
            {/* لغة المحتوى — مختصرة في الترويسة، وشرحها الكامل في «ملفي» */}
            <div className="hidden sm:block"><LangSwitcher compact /></div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">{children}</main>

      {state.toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed inset-x-0 bottom-5 z-[60] mx-auto w-fit max-w-[92vw] rounded-xl px-4 py-2.5 text-sm text-white shadow-lg ${
            state.toast.kind === "err" ? "bg-red-600" : state.toast.kind === "info" ? "bg-sky-700" : "bg-stone-800"
          }`}
        >
          {state.toast.text}
        </div>
      )}
    </div>
  );
}
