import { FooterLink } from "./footer-link";

/* ------------------------------------------------------------------ *
 * Newsletter
 * ------------------------------------------------------------------ */

function Newsletter() {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <div>
        <h2 className="font-display text-3xl leading-tight sm:text-4xl">
          New in, early.
          <br />
          twice a month.
        </h2>
        <p className="mt-3 max-w-sm text-[0.9375rem] leading-relaxed text-stone">
          New arrivals, restocks, and the occasional essay on how to wear things well.
          No noise, and never more than two emails a month.
        </p>
      </div>

      <form
        action="/api/newsletter"
        method="post"
        className="self-end"
        aria-label="Subscribe to the newsletter"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="your@email.com"
              className="h-13 w-full border-b border-line bg-transparent px-1 text-[0.9375rem] outline-none transition-colors placeholder:text-mist focus:border-ink"
            />
          </div>
          <button
            type="submit"
            className="h-13 shrink-0 rounded-pill bg-ink px-7 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-graphite"
          >
            Subscribe
          </button>
        </div>
        <p className="mt-3 text-[0.75rem] text-mist">
          By subscribing you agree to our privacy policy. Unsubscribe any time.
        </p>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Footer
 * ------------------------------------------------------------------ */

export function Footer({ columns }: { columns: readonly FooterColumn[] }) {
  return (
    <footer className="mt-24 border-t border-line bg-sand/40">
      {/* Newsletter band */}
      <div className="container-page py-16">
        <Newsletter />
      </div>

      {/* Link columns */}
      <div className="border-t border-line">
        <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="eyebrow mb-4 text-stone">{column.title}</h2>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Social */}
          <div>
            <h2 className="eyebrow mb-4 text-stone">Follow</h2>
            <ul className="flex flex-col gap-2.5">
              {socials.map((s) => (
                <li key={s.label}>
                  <FooterLink href={s.href} external>
                    {s.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[0.75rem] leading-relaxed text-mist">@wearnow</p>
          </div>
        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 text-[0.75rem] text-stone sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Wear Now. All rights reserved.</p>
          <ul className="flex items-center gap-5">
            <li>
              <FooterLink href="/legal/privacy">Privacy</FooterLink>
            </li>
            <li>
              <FooterLink href="/legal/terms">Terms</FooterLink>
            </li>
            <li>
              <FooterLink href="/legal/accessibility">Accessibility</FooterLink>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

/* ---- Local copies so the footer takes its data as props ---- */

interface FooterColumn {
  title: string;
  links: readonly { label: string; href: string }[];
}

const socials = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Pinterest", href: "https://pinterest.com" },
  { label: "TikTok", href: "https://tiktok.com" },
  { label: "YouTube", href: "https://youtube.com" },
] as const;
