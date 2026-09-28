import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Your bag",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <div className="container-page py-12 lg:py-20">
      <h1 className="text-3xl sm:text-4xl">Your bag</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-stone">
        Fill it as a guest. You only need an account at the last step, and nothing you&rsquo;ve
        chosen gets lost.
      </p>

      <div className="mt-12">
        <CartView />
      </div>
    </div>
  );
}
