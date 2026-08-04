"use client";
import React from "react";
import type { HadithGrade } from "@/lib/types";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-stone-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

export function Button({
  children, variant = "primary", size = "md", className = "", ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "outline"; size?: "sm" | "md" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-[15px]" };
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
    outline: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
    ghost: "text-stone-600 hover:bg-stone-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>{children}</button>;
}

const GRADE_LABEL: Record<HadithGrade, string> = { sahih: "صحيح", hasan: "حسن", daif: "ضعيف" };
export function GradeBadge({ grade }: { grade: HadithGrade }) {
  // a11y (REQ-07): لا يُعتمد على اللون وحده — نص + شكل مميز لكل درجة
  const map = {
    sahih: { cls: "bg-green-50 text-grade-sahih border-green-200", mark: "✓" },
    hasan: { cls: "bg-yellow-50 text-grade-hasan border-yellow-200", mark: "◆" },
    daif: { cls: "bg-red-50 text-grade-daif border-red-200", mark: "!" },
  }[grade];
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${map.cls}`}>
      <span aria-hidden>{map.mark}</span>
      <span>الدرجة: {GRADE_LABEL[grade]}</span>
    </span>
  );
}

export function EmptyState({ icon = "📭", title, hint, action }: { icon?: string; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
      <div className="text-4xl" aria-hidden>{icon}</div>
      <p className="font-semibold text-stone-700">{title}</p>
      {hint && <p className="max-w-sm text-sm text-stone-500">{hint}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200 ${className}`} />;
}

export function Modal({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/40 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className={`relative w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-md"} rounded-t-3xl sm:rounded-3xl bg-white shadow-xl max-h-[92vh] overflow-y-auto`}>
        <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3.5 rounded-t-3xl">
          <h2 className="font-semibold text-stone-800">{title}</h2>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-[15px] text-stone-900 placeholder:text-stone-400 focus:border-primary";

export function Num({ children }: { children: React.ReactNode }) {
  return <span className="nums">{children}</span>;
}
