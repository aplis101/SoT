"use client";

import { useState } from "react";
import { Button } from "./ui";
import { useStore } from "@/lib/store";
import { getRepo } from "@/lib/repo";

/**
 * بطاقة الموافقة على النشر — [FIX CONSENT-01]
 *
 * ------------------------------------------------------------------------
 * الخلل الذي تسدّه
 * ------------------------------------------------------------------------
 * `RecorderModal` يمنع الرفع إن كان `consent_given_at` فارغاً، وصفحة «ملفي»
 * تعرض حالة الموافقة — ولم يكن في التطبيق كلّه **موضع واحد يكتبها**. فكان
 * الرفع الصوتي معطَّلاً لكل مستخدم بلا استثناء: الميزة التي قامت عليها المنصة.
 *
 * ولم يظهر ذلك في بناء ولا فحص أنواع: الشرط صحيح، والحقل فارغ فعلاً، والرسالة
 * تُعرض كما كُتبت. لا يُكشف مثل هذا إلا بمحاولة تسجيل حقيقية.
 *
 * ------------------------------------------------------------------------
 * لماذا موافقة أصلاً — ولماذا هنا بالذات
 * ------------------------------------------------------------------------
 * الصوت بيانات شخصية تحت قانون حماية البيانات الإندونيسي (UU PDP)، والمنصة
 * تنشره لزملاء يستمعون ويقيّمون. فالموافقة **إذن المستخدم بنشر صوته**، لا
 * إذننا له بالاستعمال. من لم يسجّل شيئاً لا يُسأل عنها أصلاً.
 *
 * وموضعها عند أول ضغطة على «سجّل صوتك» لا عند تسجيل الدخول: من جاء ليقرأ أو
 * يستمع لا شأن له بها، وسؤاله عنها في أول لحظة احتكاكٌ بلا سبب. والسؤال عند
 * الحاجة يجعل النصّ مفهوماً في سياقه لا شرطاً يُنقر للتخلّص منه.
 */
export default function ConsentGate({ onGranted }: { onGranted?: () => void }) {
  const { dispatch } = useStore();
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    setBusy(true);
    try {
      const at = await getRepo().setConsent(true);
      dispatch({ type: "SET_CONSENT", at });
      dispatch({ type: "TOAST", text: "شكراً لك — يمكنك الآن تسجيل صوتك." });
      onGranted?.();
    } catch (e) {
      dispatch({
        type: "TOAST",
        kind: "err",
        text: e instanceof Error ? e.message : "تعذّر حفظ الموافقة.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/30 bg-primary-soft p-4">
        <h3 className="font-semibold text-stone-900">قبل أول تسجيل — إذنك بنشر صوتك</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-stone-700">
          تسجيلك سيسمعه زملاؤك في المقرَّر، ويستطيعون الإعجاب به وتفضيله والإبلاغ
          عن خطأ فيه. ويستطيع المشرف اعتماده أو إخفاءه.
        </p>
      </div>

      <ul className="space-y-2 text-[13px] text-stone-600">
        <li className="flex gap-2">
          <span aria-hidden className="text-primary">•</span>
          <span>لن يُنشر تسجيلك خارج المنصة، ولا يظهر لغير المسجَّلين فيها.</span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden className="text-primary">•</span>
          <span>تستطيع حذف أي تسجيل لك في أي وقت من صفحة «ملفي».</span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden className="text-primary">•</span>
          <span>
            وتستطيع <b>سحب هذه الموافقة</b> متى شئت — فيتوقّف الرفع، وتبقى تسجيلاتك
            السابقة حتى تحذفها بنفسك.
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden className="text-primary">•</span>
          <span>
            ما يزال قرار مصير التسجيلات في نهاية الفصل الدراسي معلَّقاً، وسيُعلَن
            لك قبل تنفيذه لا بعده.
          </span>
        </li>
      </ul>

      <Button onClick={accept} disabled={busy} className="w-full">
        {busy ? "جارٍ الحفظ…" : "أوافق على نشر تسجيلي للزملاء"}
      </Button>
      <p className="text-center text-[11px] text-stone-400">
        هذا إذنٌ منك، وسحبه بيدك وحدك.
      </p>
    </div>
  );
}
