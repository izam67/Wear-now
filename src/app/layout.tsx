import type { Metadata, Viewport } from "next";
import { Jost, Playfair_Display } from "next/font/google";
import { SiteShell } from "@/components/layout/site-shell";
import { initDatabase } from "@/lib/db/init";
import { currentUser } from "@/lib/session";
import { getCart, getWishlist } from "@/lib/queries";
import { STORE } from "@/lib/constants";
import { IMG, POOL } from "@/lib/images";
import { themeScript } from "@/lib/theme";
import "./globals.css";

/* Make sure the schema exists (and the catalog is populated) before the first
 * request is served. Cheap after the first call, and it removes the need for a
 * manual `db:seed` on a fresh clone. */
initDatabase();

const editorial = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const grotesk = Jost({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-grotesk",
  weight: ["300", "400", "500", "600"],
});

const description = STORE.description;

export const metadata: Metadata = {
  metadataBase: new URL("https://wearnow.example"),
  title: { default: "Wear Now", template: "%s · Wear Now" },
  description,
  keywords: [
    "modern fashion",
    "contemporary clothing",
    "designer handbags",
    "leather shoes",
    "fine jewelry",
    "minimal wardrobe",
  ],
  authors: [{ name: STORE.name }],
  creator: STORE.name,
  openGraph: {
    type: "website",
    siteName: STORE.name,
    title: `${STORE.name} — ${STORE.tagline}`,
    description,
    url: "/",
    images: [{ url: IMG.social(POOL.editorial[0]!), width: 1200, height: 630, alt: STORE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${STORE.name} — ${STORE.tagline}`,
    description,
    images: [IMG.social(POOL.editorial[0]!)],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#faf9f6",
  colorScheme: "light",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  return (
    <html lang="en" className={`${editorial.variable} ${grotesk.variable}`} suppressHydrationWarning>
      <head>
        {/* Must run before first paint, or the light theme flashes on dark. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
      </head>
      <body>
        <SiteShell
          signedIn={!!user}
          serverCart={user ? await getCart(user.id) : []}
          serverWishlist={user ? await getWishlist(user.id) : []}
        >
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
