"use client";
import { useStore } from "@/lib/store";
import { Card, Button } from "@/components/ui";
import type { AppSettings } from "@/lib/types";

// النطاقات مُوحَّدة هنا لحل تعارض FLW-03 (08-api-contracts مقابل sys_uc_013)
const NUMERIC: { key: keyof AppSettings; label: string; min: number; max: number; step: number; hint: string }[] = [
  { key: "active_users_window_days", label: "نافذة الطلاب النشطين (يوم)", min: 1, max: 365, step: 1, hint: "مُدخَل ALG-002 لحساب العتبات النسبية" },
  { key: "community_best_min_likes", label: "أقل إعجابات لشارة «الأفضل مجتمعياً»", min: 1, max: 100, step: 1, hint: "ALG-006" },
  { key: "listen_count_threshold_seconds", label: "ثوانٍ لاحتساب الاستماع", min: 1, max: 60, step: 1, hint: "ALG-003 — لا يُسمح بالصفر (يُبطل العدّاد)" },
  { key: "rate_limit_uploads_per_hour", label: "حد الرفع في الساعة", min: 1, max: 50, step: 1, hint: "ALG-005" },
  { key: "report_alert_min", label: "الحد الأدنى المطلق للتنبيه", min: 1, max: 100, step: 1, hint: "ALG-002" },
  { key: "report_alert_ratio", label: "نسبة التنبيه من النشطين", min: 0.01, max: 1, step: 0.01, hint: "ALG-002" },
  { key: "report_hide_min", label: "الحد الأدنى المطلق للإخفاء", min: 1, max: 100, step: 1, hint: "ALG-002" },
  { key: "report_hide_ratio", label: "نسبة الإخفاء من النشطين", min: 0.01, max: 1, step: 0.01, hint: "ALG-002" },
];

/** PAGE-007-SUB-03 / UC-013 */
export default function AdminSettings() {
  const { state, dispatch } = useStore();

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3 p-4">
        <div className="flex-1">
          <p className="font-semibold text-stone-800">الرفع مفعّل للجميع</p>
          <p className="text-[12px] text-stone-500">مفتاح إيقاف عام فوري.</p>
        </div>
        <Button variant={state.settings.upload_enabled ? "danger" : "primary"}
          onClick={() => dispatch({ type: "UPDATE_SETTING", key: "upload_enabled", value: !state.settings.upload_enabled })}>
          {state.settings.upload_enabled ? "إيقاف" : "تفعيل"}
        </Button>
      </Card>

      <Card className="divide-y divide-stone-200">
        {NUMERIC.map((f) => (
          <div key={f.key} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <label htmlFor={f.key} className="block text-sm font-medium text-stone-800">{f.label}</label>
              <p className="text-[11px] text-stone-500">{f.hint} · المدى <span className="nums">{f.min}</span>–<span className="nums">{f.max}</span></p>
            </div>
            <input
              id={f.key} type="number" min={f.min} max={f.max} step={f.step}
              value={String(state.settings[f.key])}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isNaN(v) || v < f.min || v > f.max) {
                  dispatch({ type: "TOAST", text: `القيمة يجب أن تكون بين ${f.min} و ${f.max}.`, kind: "err" });
                  return;
                }
                dispatch({ type: "UPDATE_SETTING", key: f.key, value: v });
              }}
              className="nums w-24 rounded-xl border border-stone-300 px-3 py-2 text-center"
            />
          </div>
        ))}
      </Card>

      <p className="px-1 text-[11px] text-stone-400">
        كل تعديل يُعيد تقييم الإخفاء التلقائي فوراً على جميع التسجيلات (ALG-002).
      </p>
    </div>
  );
}
