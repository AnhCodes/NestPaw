"use client";

import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [returnSent, setReturnSent] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  async function onContactSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setContactError(null);
    setContactLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          company: data.get("company"),
          inquiryType: "general",
        }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        setContactError(json.error || "Unable to send your message. Please try again.");
        setContactLoading(false);
        return;
      }

      setContactSent(true);
      setContactLoading(false);
      form.reset();
    } catch {
      setContactError("Network error. Please try again.");
      setContactLoading(false);
    }
  }

  async function onReturnSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setReturnError(null);
    setReturnLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          company: data.get("company"),
          inquiryType: "return-request",
          orderId: data.get("orderId"),
        }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        setReturnError(json.error || "Unable to send your return request. Please try again.");
        setReturnLoading(false);
        return;
      }

      setReturnSent(true);
      setReturnLoading(false);
      form.reset();
    } catch {
      setReturnError("Network error. Please try again.");
      setReturnLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32">
      <p className="text-xs uppercase tracking-[0.22em] text-leaf">Contact</p>
      <h1 className="mt-3 font-display text-4xl text-ink md:text-6xl">
        We&apos;re here to help
      </h1>
      <p className="mt-4 max-w-2xl text-ink/70">
        Questions about an order, product fit, or shipping window? Send a note
        and we&apos;ll get back within one business day.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <section className="border border-moss/15 bg-white/70 p-6 backdrop-blur-sm">
          <h2 className="font-display text-2xl text-ink">Send us a message</h2>
          {contactSent ? (
            <p className="mt-6 border border-moss/15 bg-stone/70 p-6 text-ink/80">
              Thanks, your message was sent. We&apos;ll reply to the email you
              provided within one business day.
            </p>
          ) : (
            <form onSubmit={onContactSubmit} className="mt-6 space-y-4">
              <input
                required
                name="name"
                placeholder="Name"
                className="w-full border border-moss/20 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-moss/30"
              />
              <input
                required
                type="email"
                name="email"
                placeholder="Email"
                className="w-full border border-moss/20 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-moss/30"
              />
              <textarea
                required
                name="message"
                placeholder="How can we help?"
                rows={6}
                className="w-full border border-moss/20 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-moss/30"
              />
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden
              />

              {contactError ? (
                <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {contactError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={contactLoading}
                className="bg-moss px-6 py-3.5 text-sm font-medium text-mist transition hover:bg-moss-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                {contactLoading ? "Sending..." : "Send message"}
              </button>
            </form>
          )}
        </section>

        <aside className="border border-moss/15 bg-stone/60 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-leaf">Returns</p>
          <h2 className="mt-3 font-display text-2xl text-ink">Submit a return request</h2>
          <p className="mt-4 text-sm leading-6 text-ink/75">
            Standard returns are not guaranteed, but if your order arrived
            damaged, incorrect, or had a shipping issue, submit a request here
            and we&apos;ll review it.
          </p>
          {returnSent ? (
            <p className="mt-6 border border-moss/15 bg-white/70 p-4 text-sm text-ink/80">
              Your return request was submitted. We&apos;ll review it and follow up
              by email.
            </p>
          ) : (
            <form onSubmit={onReturnSubmit} className="mt-6 space-y-4">
              <input
                required
                name="name"
                placeholder="Name"
                className="w-full border border-moss/20 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-moss/30"
              />
              <input
                required
                type="email"
                name="email"
                placeholder="Email used on order"
                className="w-full border border-moss/20 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-moss/30"
              />
              <input
                required
                name="orderId"
                placeholder="Order number"
                className="w-full border border-moss/20 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-moss/30"
              />
              <textarea
                required
                name="message"
                placeholder="Tell us what happened and include any relevant details."
                rows={5}
                className="w-full border border-moss/20 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-moss/30"
              />
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden
              />

              {returnError ? (
                <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {returnError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={returnLoading}
                className="bg-moss px-6 py-3.5 text-sm font-medium text-mist transition hover:bg-moss-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                {returnLoading ? "Submitting..." : "Submit return request"}
              </button>
            </form>
          )}
          <p className="mt-4 text-xs leading-6 text-ink/65">
            Use the same email from checkout so we can match your request to the
            correct order.
          </p>
        </aside>
      </div>
    </div>
  );
}
