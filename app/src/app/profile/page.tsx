"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, Button, EmptyState, Modal } from "@/components/ui";

/** PAGE-006 / F007 — الملف الشخصي */
export default function ProfilePage() {
  const { state, dispatch, me, isAdmin } = useStore();
  const MOCK_HADITHS = state.hadiths;
  const [confirm, setConfirm] = useState<string | null>(null);
  if (!me) return null;

  const mine = state.recordings.filter((r) => r.user_id === me.id);
  const myFavs = state.favorites.filter((f) => f.user_id === me.id);
  const myLikes = state.likes.filter((l) => l.user_id === me.id);
  const hadithOf = (id: string) => MOCK_HADITHS.find((h) => h.id === id);

  const stats = [
    { label: "تسجيلاتي", value: mine.length },
    { label: "إعجابات تلقّيتها", value: mine.reduce((s, r) => s + r.likes_count, 0) },
    { label: "استماعات لتسجيلاتي", value: mine.reduce((s, r) => s + r.listens_count, 0) },
    { label: "مفضّلاتي ⭐", value: myFavs.length },
  ];

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-xl font-bold text-primary">
            {me.display_name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-stone-900">{me.display_name}</p>
            <p className="text-sm text-stone-500">{isAdmin ? "مشرف المادة" : "طالب"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => dispatch({ type: "LOGOUT" })}>خروج</Button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-stone-50 p-3 text-center">
              <dd className="nums text-xl font-bold text-stone-900">{s.value}</dd>
              <dt className="mt-0.5 text-[11px] text-stone-500">{s.label}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-4 rounded-xl border border-stone-200 px-3 py-2.5 text-[13px]">
          <span className="text-stone-600">الموافقة على النشر: </span>
          {me.consent_given_at
            ? <span className="font-medium text-primary">مُقرَّة ✓</span>
            : <span className="font-medium text-red-600">غير مُقرَّة — لا يمكنك الرفع</span>}
        </div>
      </Card>

      <section className="space-y-2">
        <h2 className="px-1 font-semibold text-stone-800">تسجيلاتي (<span className="nums">{mine.length}</span>)</h2>
        {mine.length === 0 ? (
          <EmptyState icon="🎤" title="لم تسجّل شيئاً بعد" hint="افتح أي حديث واضغط «سجّل صوتك» لتبدأ."
            action={<Link href="/"><Button size="sm">تصفّح المكتبة</Button></Link>} />
        ) : (
          <ul className="space-y-2">
            {mine.map((r) => {
              const h = hadithOf(r.hadith_id);
              return (
                <li key={r.id}>
                  <Card className="p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
                      {r.is_verified && <span className="rounded-md bg-primary-soft px-1.5 py-0.5 font-semibold text-primary">✅ معتمد</span>}
                      {r.is_hidden && <span className="rounded-md bg-red-100 px-1.5 py-0.5 font-semibold text-red-700">مخفي ببلاغات</span>}
                      <span className="text-stone-500">❤️ <span className="nums">{r.likes_count}</span></span>
                      <span className="text-stone-500">🎧 <span className="nums">{r.listens_count}</span></span>
                      <span className="mr-auto nums text-stone-400">{new Date(r.created_at).toLocaleDateString("ar-EG")}</span>
                    </div>
                    <p className="font-hadith text-[17px] leading-8 text-stone-800 line-clamp-2">{h?.matn_ar}</p>
                    <div className="mt-3 flex gap-2">
                      {h && <Link href={`/hadiths/${h.id}`} className="flex-1"><Button size="sm" variant="outline" className="w-full">فتح الحديث</Button></Link>}
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setConfirm(r.id)}>حذف</Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="px-1 font-semibold text-stone-800">مفضّلاتي ⭐ (<span className="nums">{myFavs.length}</span>)</h2>
        {myFavs.length === 0 ? (
          <EmptyState icon="⭐" title="لا مفضّلات بعد" hint="ضع نجمة على تسجيل ليصبح مرجعك الافتراضي في ذلك الحديث." />
        ) : (
          <ul className="space-y-2">
            {myFavs.map((f) => {
              const r = state.recordings.find((x) => x.id === f.recording_id);
              const h = r && hadithOf(r.hadith_id);
              if (!r || !h) return null;
              const owner = state.profiles.find((p) => p.id === r.user_id);
              return (
                <li key={f.recording_id}>
                  <Link href={`/hadiths/${h.id}`}>
                    <Card className="p-4 transition hover:border-primary">
                      <p className="mb-1 text-[13px] text-stone-500">تسجيل {owner?.display_name}</p>
                      <p className="font-hadith text-[17px] leading-8 text-stone-800 line-clamp-2">{h.matn_ar}</p>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="px-1 text-[11px] text-stone-400">
        أعجبتك <span className="nums">{myLikes.length}</span> تسجيلات · الإعجاب ❤️ تقييم عام، والنجمة ⭐ مرجعك الشخصي فقط (ALG-006).
      </p>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="تأكيد الحذف">
        <p className="text-sm text-stone-600">سيُحذف التسجيل نهائياً مع إعجاباته. لا يمكن التراجع.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>إلغاء</Button>
          <Button variant="danger" className="flex-1" onClick={() => { dispatch({ type: "DELETE_RECORDING", recordingId: confirm! }); dispatch({ type: "TOAST", text: "تم الحذف." }); setConfirm(null); }}>
            حذف
          </Button>
        </div>
      </Modal>
    </div>
  );
}
