import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-[0.6875rem] uppercase tracking-[0.22em] text-mist">Error 404</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">This page has moved on</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-stone">
        The link may be old, or the piece may have sold out and been retired. The rest of the shop
        is still where you left it.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClass({ size: "lg" })}>
          Back to home
        </Link>
        <Link href="/new-arrivals" className={buttonClass({ size: "lg", variant: "outline" })}>
          Shop new arrivals
        </Link>
        <Link href="/search" className={buttonClass({ size: "lg", variant: "ghost" })}>
          Search everything
        </Link>
      </div>
    </div>
  );
}
