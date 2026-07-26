import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32">
      <p className="text-xs uppercase tracking-[0.22em] text-leaf">Legal</p>
      <h1 className="mt-3 font-display text-4xl text-ink md:text-6xl">
        Privacy policy
      </h1>
      <div className="mt-8 space-y-5 text-ink/75">
        <p>
          NestPaw collects information you provide at checkout and through
          contact forms — such as name, email, shipping address, and order
          details — to fulfill orders and respond to support requests.
        </p>
        <p>
          We may use trusted processors for payments, shipping, analytics, and
          email. We do not sell personal information. Cart contents may be stored
          locally in your browser to keep your shopping session intact.
        </p>
        <p>
          For privacy questions, contact us via the Contact page. This policy
          will be updated when live payment and fulfillment providers are
          connected.
        </p>
      </div>
    </div>
  );
}
