/**
 * اختيار مصدر البيانات — نقطة التبديل الوحيدة في المشروع كله.
 *
 * mock      → بيانات محلية، لا خادم، لا مفاتيح.
 * supabase  → قاعدة بيانات حقيقية + Auth + Storage.
 *
 * يُضبط بـNEXT_PUBLIC_DATA_SOURCE في .env.local
 */
import { DATA_SOURCE, IS_PLACEHOLDER_CONFIG } from "../config";
import type { Repo } from "./types";
import { mockRepo } from "./mock";
import { supabaseRepo } from "./supabase";

let _repo: Repo | null = null;

export function getRepo(): Repo {
  if (_repo) return _repo;

  if (DATA_SOURCE === "supabase") {
    if (IS_PLACEHOLDER_CONFIG) {
      // حارس أمان: لا نحاول الاتصال بمفاتيح تنكرية — نعود للوضع الوهمي مع تحذير.
      console.warn(
        "[repo] NEXT_PUBLIC_DATA_SOURCE=supabase لكن المفاتيح ما تزال تنكرية. " +
        "سيعمل التطبيق بالبيانات الوهمية. استبدل المفاتيح في .env.local."
      );
      _repo = mockRepo;
      return _repo;
    }
    _repo = supabaseRepo;
    return _repo;
  }

  _repo = mockRepo;
  return _repo;
}

/** هل نعمل فعلاً على قاعدة بيانات حقيقية؟ */
export function isLive(): boolean {
  return getRepo().kind === "supabase";
}

export type { Repo, ContentSnapshot, InteractionSnapshot } from "./types";
