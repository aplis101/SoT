"use client";
import { useEffect } from "react";
import { installDiagnostics } from "@/lib/diagnostics";

/** يركّب ملتقط الأخطاء مرة واحدة عند الإقلاع — بلا واجهة. */
export default function Diagnostics() {
  useEffect(() => { installDiagnostics(); }, []);
  return null;
}
