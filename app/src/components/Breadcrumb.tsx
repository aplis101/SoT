import Link from "next/link";

export default function Breadcrumb({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="مسار التنقل" className="flex flex-wrap items-center gap-1.5 text-[13px] text-stone-500">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {it.href ? <Link href={it.href} className="hover:text-primary hover:underline">{it.label}</Link> : <span className="text-stone-700">{it.label}</span>}
          {i < items.length - 1 && <span aria-hidden className="text-stone-300">›</span>}
        </span>
      ))}
    </nav>
  );
}
