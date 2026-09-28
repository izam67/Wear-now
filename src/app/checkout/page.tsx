import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutFlow } from "./checkout-flow";
import { getCart, listAddresses } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

/**
 * Checkout is the one place an account is mandatory — the order has to be
 * attached to somebody. `requireUser` sends guests to sign-in and back here.
 */
export default async function CheckoutPage() {
  const user = await requireUser("/checkout");

  const lines = await getCart(user.id);
  const addresses = await listAddresses(user.id);

  // An empty bag should land on the bag page, not an unusable summary.
  if (lines.length === 0) redirect("/cart");

  return (
    <div className="container-page py-12 lg:py-20">
      <h1 className="text-3xl sm:text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-stone">
        Signed in as {user.email}. Your bag came with you.
      </p>

      <div className="mt-12">
        <CheckoutFlow
          userId={user.id}
          email={user.email}
          firstName={user.firstName}
          lastName={user.lastName}
          addresses={addresses}
          lines={lines}
        />
      </div>
    </div>
  );
}
