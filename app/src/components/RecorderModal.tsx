"use client";
import { useEffect, useRef, useState } from "react";
import { Modal, Button } from "./ui";
import ConsentGate from "./ConsentGate";
import { useStore } from "@/lib/store";
import { checkRateLimit } from "@/lib/algorithms";
import type { Recording } from "@/lib/types";

const MAX_SECONDS = 180;

/** F004 / UC-008 / PAGE-005-SUB-02 — التسجيل والرفع */
export default function RecorderModal({ open, onClose, hadithId }: { open: boolean; onClose: () => void; hadithId: string }) {
  const { state, dispatch, me } = useStore();
  const [phase, setPhase] = useState<"idle" | "recording" | "review" | "uploading">("idle");
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const needsConsent = !!me && !me.consent_given_at;
  const existing = state.recordings.find((r) => r.hadith_id === hadithId && r.user_id === me?.id);
  const rate = checkRateLimit(state.uploadTimestamps, state.settings.rate_limit_uploads_per_hour);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const reset = () => {
    setPhase("idle"); setSeconds(0); setUrl(null); setError(null); setProgress(0);
    if (timer.current) clearInterval(timer.current);
  };

  const start = async () => {
    setError(null);
    if (!state.settings.upload_enabled) { setError("الرفع موقوف حالياً بقرار من المشرف."); return; }
    if (!rate.allowed) { setError(`تجاوزت حد الرفع (${state.settings.rate_limit_uploads_per_hour} في الساعة). أعد المحاولة بعد ${rate.retryAfterMinutes} دقيقة.`); return; }
    // [FIX CONSENT-01] الموافقة لم تعد رسالة منع بلا مخرج — البطاقة تُعرض
    // قبل الوصول إلى هنا. هذا الشرط باقٍ حارساً لو استُدعيت الدالة بغير مسارها.
    if (!me?.consent_given_at) { setError("يلزم إقرار الموافقة على نشر التسجيل قبل الرفع."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        setUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        setPhase("review");
      };
      mediaRef.current = mr;
      mr.start();
      setPhase("recording"); setSeconds(0);
      timer.current = setInterval(() => setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) { mr.stop(); if (timer.current) clearInterval(timer.current); }
        return s + 1;
      }), 1000);
    } catch {
      setError("تعذّر الوصول إلى الميكروفون. امنح الإذن من إعدادات المتصفح ثم أعد المحاولة.");
    }
  };

  const stop = () => { mediaRef.current?.stop(); if (timer.current) clearInterval(timer.current); };

  const upload = () => {
    setPhase("uploading"); setProgress(0);
    // محاكاة الضغط ثم الرفع (يُستبدل بـ Supabase Storage عند الربط)
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(iv);
          const rec: Recording = {
            id: `r-${Math.random().toString(36).slice(2, 8)}`,
            hadith_id: hadithId,
            user_id: me!.id,
            file_path: `mock-audio/tone-${1 + Math.floor(Math.random() * 3)}.wav`,
            duration_seconds: seconds || 8,
            file_size_bytes: (seconds || 8) * 4000,
            codec: "opus", bitrate_kbps: 32,
            likes_count: 0, listens_count: 0,
            is_verified: false, is_hidden: false, verified_by: null,
            created_at: new Date().toISOString(),
          };
          dispatch({ type: "ADD_RECORDING", recording: rec });
          dispatch({ type: "TOAST", text: existing ? "تم استبدال تسجيلك السابق بنجاح." : "تم رفع تسجيلك بنجاح." });
          reset(); onClose();
          return 100;
        }
        return p + 10;
      });
    }, 90);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={needsConsent ? "إذن النشر" : "تسجيل صوتي جديد"}>
      {/* [FIX CONSENT-01] البوابة أولاً: لا معنى لعرض زرّ تسجيل يرفض العمل */}
      {needsConsent ? <ConsentGate /> : <>
      {existing && phase === "idle" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
          لديك تسجيل سابق لهذا الحديث. الرفع الجديد <b>سيستبدله</b>، وستُفقد إعجاباته ونجومه (ALG-004).
        </div>
      )}

      <div className="flex flex-col items-center gap-4 py-3">
        <div className={`flex h-28 w-28 items-center justify-center rounded-full ${phase === "recording" ? "bg-red-50 ring-4 ring-red-200 animate-pulse" : "bg-stone-100"}`}>
          <span className="text-4xl" aria-hidden>{phase === "recording" ? "🎙️" : phase === "review" ? "🎧" : "🎤"}</span>
        </div>
        <p className="nums text-2xl font-semibold text-stone-800">{mm}:{ss}</p>
        <p className="text-xs text-stone-500">الحد الأقصى <span className="nums">3</span> دقائق · يُضغط الصوت على جهازك قبل الرفع</p>

        {phase === "idle" && <Button onClick={start} className="w-full">بدء التسجيل</Button>}
        {phase === "recording" && <Button variant="danger" onClick={stop} className="w-full">إيقاف</Button>}

        {phase === "review" && url && (
          <div className="w-full space-y-3">
            <audio src={url} controls className="w-full" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">إعادة التسجيل</Button>
              <Button onClick={upload} className="flex-1">رفع التسجيل</Button>
            </div>
          </div>
        )}

        {phase === "uploading" && (
          <div className="w-full space-y-2">
            <div className="h-2 rounded-full bg-stone-200"><div className="h-2 rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} /></div>
            <p className="text-center text-xs text-stone-500">جارٍ الضغط والرفع… <span className="nums">{progress}</span>%</p>
          </div>
        )}

        {error && <p role="alert" className="w-full rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
        {rate.allowed && phase === "idle" && (
          <p className="text-[11px] text-stone-400">متبقٍ لك <span className="nums">{rate.remaining}</span> عمليات رفع هذه الساعة</p>
        )}
      </div>
      </>}
    </Modal>
  );
}
