"use client";

import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
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
          Thanks — your message is noted. (Demo form: connect email or a helpdesk
          when you go live.)
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
          <button
            type="submit"
            className="bg-moss px-6 py-3.5 text-sm font-medium text-mist transition hover:bg-moss-deep"
          >
            Send message
          </button>
        </form>
      )}
    </div>
  );
}
