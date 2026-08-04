"use client";
import { useEffect, useRef, useState } from "react";
import type { RecordingView } from "@/lib/types";
import { ListenCounter } from "@/lib/algorithms";
import { useStore } from "@/lib/store";

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** F003 / UC-004 — المشغل الصوتي مع عدّاد الاستماع الذكي ALG-003 */
export default function AudioPlayer({ rec, compact = false }: { rec: RecordingView | null; compact?: boolean }) {
  const { state, dispatch } = useStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const counterRef = useRef(new ListenCounter(state.settings.listen_count_threshold_seconds));
  const lastTime = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(rec?.duration_seconds ?? 0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    counterRef.current = new ListenCounter(state.settings.listen_count_threshold_seconds);
    lastTime.current = 0;
    setT(0); setPlaying(false); setErr(null);
    setDur(rec?.duration_seconds ?? 0);
  }, [rec?.id, state.settings.listen_count_threshold_seconds, rec?.duration_seconds]);

  if (!rec) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-5 text-center text-sm text-stone-500">
        لا يوجد تسجيل صوتي لهذا الحديث بعد — كن أول من يسجّل.
      </div>
    );
  }

  const onTime = () => {
    const a = audioRef.current!;
    const delta = a.currentTime - lastTime.current;
    // ALG-003: التقديم السريع يُصفّر التراكم (قرار مثبَّت في review/)
    if (Math.abs(delta) > 1.5) counterRef.current.onSeek();
    else if (delta > 0 && counterRef.current.tick(delta)) {
      dispatch({ type: "COUNT_LISTEN", recordingId: rec.id });
    }
    lastTime.current = a.currentTime;
    setT(a.currentTime);
  };

  const toggle = async () => {
    const a = audioRef.current!;
    try {
      setErr(null);
      if (a.paused) { setLoading(true); await a.play(); setPlaying(true); }
      else { a.pause(); setPlaying(false); }
    } catch {
      setErr("تعذّر تشغيل الصوت. تحقّق من اتصالك ثم أعد المحاولة.");
    } finally { setLoading(false); }
  };

  const pct = dur ? (t / dur) * 100 : 0;

  return (
    <div className={`rounded-2xl border border-stone-200 bg-white ${compact ? "p-3" : "p-4"} shadow-sm`}>
      <audio
        ref={audioRef}
        src={rec.file_url}
        preload="metadata"
        onTimeUpdate={onTime}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || rec.duration_seconds)}
        onEnded={() => { setPlaying(false); setT(0); lastTime.current = 0; }}
        onError={() => setErr("تعذّر تحميل الملف الصوتي.")}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={loading}
          aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow transition hover:bg-primary-hover disabled:opacity-60"
        >
          <span aria-hidden className="text-lg">{loading ? "…" : playing ? "❚❚" : "▶"}</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-stone-800">{rec.display_name}</span>
            {rec.is_verified && <span title="معتمد من المشرف" className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">✅ معتمد</span>}
            {rec.favorited_by_me && <span title="مفضّلتي" className="text-favorite" aria-label="مفضّلتي">⭐</span>}
            {rec.is_community_best && <span title="الأفضل مجتمعياً" className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-like">الأفضل مجتمعياً</span>}
          </div>

          {/* شريط التقدم — في RTL يمتلئ من اليمين لليسار */}
          <div
            role="slider"
            tabIndex={0}
            aria-label="موضع التشغيل"
            aria-valuemin={0}
            aria-valuemax={Math.round(dur)}
            aria-valuenow={Math.round(t)}
            onClick={(e) => {
              const box = e.currentTarget.getBoundingClientRect();
              const ratio = (box.right - e.clientX) / box.width; // RTL
              const a = audioRef.current!;
              counterRef.current.onSeek();
              a.currentTime = Math.max(0, Math.min(dur * ratio, dur));
            }}
            className="mt-2 h-2 cursor-pointer rounded-full bg-stone-200"
          >
            <div className="h-2 rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
            <span className="nums">{fmt(t)} / {fmt(dur)}</span>
            <span className="flex items-center gap-2">
              <span title="عدد الاستماعات"><span className="nums">{rec.listens_count}</span> استماع</span>
              <span aria-hidden>·</span>
              <span title="عدد الإعجابات">❤️ <span className="nums">{rec.likes_count}</span></span>
            </span>
          </div>
        </div>
      </div>

      {err && <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
      {!counterRef.current.hasCounted && playing && (
        <p className="mt-2 text-[11px] text-stone-400">
          يُحتسب الاستماع بعد <span className="nums">{state.settings.listen_count_threshold_seconds}</span> ثوانٍ متصلة (ALG-003)
        </p>
      )}
    </div>
  );
}
