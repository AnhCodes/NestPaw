import Link from "next/link";
import { ClearCartOnSuccess } from "@/components/clear-cart-on-success";
import { getStripe } from "@/lib/stripe";

type SearchParams = Promise<{ session_id?: string }>;

export const metadata = {
  title: "Order confirmed",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id: sessionId } = await searchParams;
  const stripe = getStripe();

  let email: string | null = null;
  let amountTotal: number | null = null;

  if (stripe && sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      email = session.customer_details?.email ?? session.customer_email ?? null;
      amountTotal = session.amount_total;
    } catch {
      /* session lookup optional for UI */
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-20 pt-28 md:px-8 md:pt-32">
      <ClearCartOnSuccess />
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
        Payment received
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-ink md:text-5xl">
        Thank you
      </h1>
      <p className="mt-4 text-ink-soft">
        Your NestPaw order is confirmed
        {email ? (
          <>
            {" "}
            for <span className="text-ink">{email}</span>
          </>
        ) : null}
        {amountTotal != null ? (
          <>
            {" "}
            · paid{" "}
            <span className="text-ink">
              {(amountTotal / 100).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </span>
          </>
        ) : null}
        . We&apos;ll fulfill from wholesale inventory and email tracking when
        your order ships.
      </p>
      {sessionId ? (
        <p className="mt-3 text-xs text-ink/45">Stripe session: {sessionId}</p>
      ) : null}
      <Link href="/shop" className="btn-primary mt-8 inline-flex">
        Continue shopping
      </Link>
    </div>
  );
}
