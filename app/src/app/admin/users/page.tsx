"use client";

/**
 * PAGE-012 / F012 — إدارة المستخدمين والرتب
 *
 * كان منح رتبة المشرف يتطلّب فتح لوحة Supabase وكتابة `UPDATE` يدوياً. مقبولٌ
 * مرةً واحدة لتعيين المالك، غير مقبول كلما أردتَ إشراك زميل — والنتيجة العملية
 * أن أحداً لا يُشرَك، فيبقى العبء كله على شخص واحد.
 *
 * والحارس هنا **ليس هذه الصفحة**. الصفحة تخفي الأزرار عن غير المدير الأعلى،
 * لكن `set_user_role()` في القاعدة ترفض الاستدعاء نفسه إن لم يكن المستدعي
 * مديراً أعلى — وترفض أيضاً أن يعدّل أحدٌ رتبة نفسه، أو أن تُمسّ رتبة مدير
 * أعلى آخر. إخفاء الزرّ راحةٌ للعين لا أمان (19-security-model.md §٢).
 */

import { useCallback, useEffect, useState } from "react";
import { Card, Button, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import type { AdminUser } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  student: "طالب",
  admin: "مشرف",
  superadmin: "مدير أعلى",
};

export default function AdminUsersPage() {
  const { dispatch, isSuperadmin, me } = useStore();
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await getRepo().listUsers());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل المستخدمين");
      setRows([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const change = async (u: AdminUser, role: "student" | "admin") => {
    setBusy(u.id);
    try {
      await getRepo().setUserRole(u.id, role);
      dispatch({
        type: "TOAST",
        text: role === "admin" ? `صار ${u.display_name} مشرفاً.` : `نُزعت رتبة الإشراف عن ${u.display_name}.`,
      });
      await load();
    } catch (e) {
      dispatch({ type: "TOAST", kind: "err", text: e instanceof Error ? e.message : "تعذّر تغيير الرتبة" });
    } finally {
      setBusy(null);
    }
  };

  if (rows === null) return <EmptyState icon="⏳" title="جارٍ تحميل المستخدمين…" />;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-[13px] leading-relaxed text-stone-600">
          {isSuperadmin ? (
            <>
              أنت <b>المدير الأعلى</b>. تستطيع منح رتبة المشرف ونزعها من هنا.
              أما رتبة المدير الأعلى فلا تُمنح من الموقع إطلاقاً — من قاعدة
              البيانات وحدها. هذا مقصود: أخطر ثغرة في أي نظام رتب مسارٌ يرقّي به
              أحدٌ نفسه.
            </>
          ) : (
            <>
              عرضٌ فقط. منح الرتب للمدير الأعلى وحده، والقاعدة ترفض الاستدعاء من
              غيره حتى لو استُدعيت مباشرةً.
            </>
          )}
        </p>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState icon="👤" title="لا مستخدمين بعد" hint="أول من يسجّل دخوله سيظهر هنا." />
      ) : (
        <ul className="space-y-2">
          {rows.map((u) => {
            const isMe = u.id === me?.id;
            const locked = u.role === "superadmin" || isMe;
            return (
              <li key={u.id}>
                <Card className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-900">
                      {u.display_name}
                      {isMe && <span className="mr-2 text-[11px] font-normal text-stone-400">(أنت)</span>}
                    </p>
                    {u.email && <p className="latin text-[12px] text-stone-500">{u.email}</p>}
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      <span className="nums">{u.recordings}</span> تسجيلاً ·{" "}
                      {u.consent_ok ? "الإذن مُقرّ" : "الإذن غير مُقرّ"}
                    </p>
                  </div>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                      u.role === "superadmin"
                        ? "bg-primary text-white"
                        : u.role === "admin"
                          ? "bg-primary-soft text-primary"
                          : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>

                  {isSuperadmin && !locked && (
                    <Button
                      size="sm"
                      variant={u.role === "admin" ? "outline" : "primary"}
                      disabled={busy === u.id}
                      onClick={() => change(u, u.role === "admin" ? "student" : "admin")}
                    >
                      {busy === u.id ? "…" : u.role === "admin" ? "انزع الإشراف" : "اجعله مشرفاً"}
                    </Button>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <p className="px-1 text-[11px] text-stone-400">
        كل تغيير رتبة يُكتب في <span className="latin">audit_log</span> مع الفاعل والوقت — تغيير الصلاحيات
        أخطر ما يجري في المنصة، وأولى شيء بالمساءلة.
      </p>
    </div>
  );
}
