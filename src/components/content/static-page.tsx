import type { ReactNode } from "react";

/**
 * Shared shell for marketing, help and legal pages: a consistent reading-width
 * layout with an eyebrow, headline and optional lede, plus prose building
 * blocks so text pages stay visually aligned with the storefront.
 */
export function StaticPage({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <article className="container-page py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <header>
          {eyebrow ? <p className="eyebrow text-clay">{eyebrow}</p> : null}
          <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {lede ? <p className="mt-5 text-lg leading-relaxed text-stone">{lede}</p> : null}
        </header>
        <div className="mt-12 space-y-12">{children}</div>
      </div>
    </article>
  );
}

export function ProseSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl tracking-tight">{heading}</h2>
      <div className="mt-4 space-y-4 text-[0.9375rem] leading-relaxed text-stone">{children}</div>
    </section>
  );
}

export function ProseList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-clay" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}