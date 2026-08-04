"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, Button } from "@/components/ui";
import { reportThresholds } from "@/lib/algorithms";

export default function AdminHome() {
  const { state, dispatch, activeUsersCount } = useStore();
  const openReports = state.reports.filter((r) => r.status === "open").length;
  const openContent = state.contentReports.filter((r) => r.status === "open").length;
  const hidden = state.recordings.filter((r) => r.is_hidden).length;
  const verified = state.recordings.filter((r) => r.is_verified).length;
  const t = reportThresholds(activeUsersCount, state.settings);

  const cards = [
    { label: "بلاغات صوتية مفتوحة", value: openReports, href: "/admin/reports", tone: openReports ? "warn" : "ok" },
    { label: "بلاغات محتوى مفتوحة", value: openContent, href: "/admin/content-reports", tone: openContent ? "warn" : "ok" },
    { label: "تسجيلات مخفية", value: hidden, href: "/admin/reports", tone: hidden ? "warn" : "ok" },
    { label: "تسجيلات معتمدة ✅", value: verified, href: "/admin/reports", tone: "ok" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className={`p-4 transition hover:shadow-md ${c.tone === "warn" ? "border-amber-300 bg-amber-50" : ""}`}>
              <p className="nums text-2xl font-bold text-stone-900">{c.value}</p>
              <p className="mt-1 text-[12px] text-stone-600">{c.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold text-stone-800">العتبات النافذة الآن (ALG-002)</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-stone-600">الطلاب النشطون (آخر <span className="nums">{state.settings.active_users_window_days}</span> يوماً)</dt><dd className="nums font-semibold">{activeUsersCount}</dd></div>
          <div className="flex justify-between"><dt className="text-stone-600">عتبة التنبيه</dt><dd className="nums font-semibold text-amber-700">{t.alert} بلاغات</dd></div>
          <div className="flex justify-between"><dt className="text-stone-600">عتبة الإخفاء التلقائي</dt><dd className="nums font-semibold text-red-700">{t.hide} بلاغات</dd></div>
        </dl>
        <p className="mt-3 text-[11px] text-stone-400">العتبة = أكبر قيمة بين (الحد الأدنى المطلق) و(النشطون × النسبة).</p>
      </Card>

      <Card className="flex items-center gap-3 p-4">
        <div className="flex-1">
          <p className="font-semibold text-stone-800">مفتاح الرفع العام</p>
          <p className="text-[12px] text-stone-500">إيقافه يمنع كل الطلاب من رفع تسجيلات جديدة فوراً.</p>
        </div>
        <Button
          variant={state.settings.upload_enabled ? "danger" : "primary"}
          onClick={() => {
            dispatch({ type: "UPDATE_SETTING", key: "upload_enabled", value: !state.settings.upload_enabled });
            dispatch({ type: "TOAST", text: state.settings.upload_enabled ? "أُوقف الرفع للجميع." : "أُعيد تفعيل الرفع." });
          }}
        >
          {state.settings.upload_enabled ? "إيقاف الرفع" : "تفعيل الرفع"}
        </Button>
      </Card>
    </div>
  );
}
