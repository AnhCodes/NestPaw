"use client";

import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

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
        }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        setError(json.error || "Unable to send your message. Please try again.");
        setLoading(false);
        return;
      }

      setSent(true);
      form.reset();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32">
      <p className="text-xs uppercase tracking-[0.22em] text-leaf">Contact</p>
      <h1 className="mt-3 font-display text-4xl text-ink md:text-6xl">
        We&apos;re here to help
      </h1>
      <p className="mt-4 text-ink/70">
        Questions about an order, product fit, or shipping window? Send a note
        and we&apos;ll get back within one business day.
      </p>

      {sent ? (
        <p className="mt-10 border border-moss/15 bg-stone/70 p-6 text-ink/80">
          Thanks — your message was sent. We&apos;ll reply to the email you
          provided within one business day.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 space-y-4">
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

          {error ? (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="bg-moss px-6 py-3.5 text-sm font-medium text-mist transition hover:bg-moss-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}
