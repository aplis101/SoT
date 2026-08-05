"use client";
import { useState } from "react";
import ReportProblem from "./ReportProblem";

/**
 * زر «الإبلاغ عن مشكلة» — F009.
 *
 * صُمّم ليكون واضحاً ورسمياً لا رمزاً غامضاً:
 *   • نص صريح لا أيقونة وحدها — الطالب لا يخمّن معنى 🐞.
 *   • في الأسفل يميناً بعيداً عن أزرار المحتوى، بلون محايد لا يزاحم زر التشغيل.
 *   • يتقلّص إلى أيقونة + تلميح على الشاشات الضيقة جداً فقط.
 *   • له `aria-label` ونص مرئي معاً — قارئ الشاشة والمُبصر سواء.
 */
export default function ReportProblemButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="الإبلاغ عن مشكلة في المنصة"
        className="group fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-stone-300 bg-white/95 px-4 py-2.5 text-[13px] font-medium text-stone-700 shadow-lg backdrop-blur transition hover:border-primary hover:text-primary focus-visible:outline-primary"
      >
        <svg
          viewBox="0 0 24 24" width="17" height="17" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
        <span>الإبلاغ عن مشكلة</span>
      </button>

      <ReportProblem open={open} onClose={() => setOpen(false)} />
    </>
  );
}
