/**
 * Service Worker — منصة الحديث الشريف
 *
 * الاستراتيجية:
 *   • الصوتيات  → Cache-First مع سقف حجم. الاستماع المتكرر لا يستهلك حصة Egress
 *                 من Supabase (وهي القيد الأقرب للتجاوز في الخطة المجانية، لا التخزين).
 *   • الأصول    → Stale-While-Revalidate.
 *   • الصفحات   → Network-First مع رجوع للكاش عند انقطاع الشبكة.
 *   • الكتابة   → لا تُخزَّن إطلاقاً (POST/PATCH/DELETE تمر مباشرةً).
 */

const VERSION = "v1";
const SHELL = `shell-${VERSION}`;
const AUDIO = `audio-${VERSION}`;
const PAGES = `pages-${VERSION}`;

const SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

/** سقف كاش الصوتيات — يمنع امتلاء قرص الجهاز */
const AUDIO_MAX_ENTRIES = 60;

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) {
    for (const k of keys.slice(0, keys.length - max)) await cache.delete(k);
  }
}

function isAudio(req, url) {
  return (
    req.destination === "audio" ||
    /\.(wav|mp3|ogg|opus|webm|m4a)(\?|$)/i.test(url.pathname) ||
    /\/storage\/v1\/object\//.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;              // لا نتدخّل في الكتابة إطلاقاً

  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // ---- الصوتيات: Cache-First ----
  if (isAudio(request, url)) {
    event.respondWith((async () => {
      const cache = await caches.open(AUDIO);
      // الروابط الموقّعة تحمل توقيعاً متغيّراً — نُطابق بالمسار وحده
      const key = url.origin + url.pathname;
      const hit = await cache.match(key);
      if (hit) return hit;
      try {
        const res = await fetch(request);
        if (res.ok && res.status === 200) {
          await cache.put(key, res.clone());
          trimCache(AUDIO, AUDIO_MAX_ENTRIES);
        }
        return res;
      } catch {
        return new Response("", { status: 504, statusText: "الصوت غير متاح دون اتصال" });
      }
    })());
    return;
  }

  // ---- ملفات Next الثابتة: Stale-While-Revalidate ----
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const hit = await cache.match(request);
      const net = fetch(request).then((res) => {
        if (res.ok) cache.put(request, res.clone());
        return res;
      }).catch(() => hit);
      return hit || net;
    })());
    return;
  }

  // ---- الصفحات: Network-First ----
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await fetch(request);
        const cache = await caches.open(PAGES);
        if (res.ok) cache.put(request, res.clone());
        return res;
      } catch {
        const cache = await caches.open(PAGES);
        return (await cache.match(request)) || (await caches.match("/")) ||
          new Response("<h1 dir=rtl>لا يوجد اتصال</h1>", {
            status: 503, headers: { "Content-Type": "text/html; charset=utf-8" },
          });
      }
    })());
  }
});
