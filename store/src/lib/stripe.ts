import Stripe from "stripe";
import { getSiteUrl } from "@/lib/site";

export { getSiteUrl };

function isLocalDev() {
  return process.env.NODE_ENV === "development";
}

/** Secret key: local/test in development, live in production/preview. */
export function getStripeSecretKey() {
  if (isLocalDev()) {
    return (
      process.env.STRIPE_SECRET_KEY_LOCAL ||
      process.env.STRIPE_SECRET_KEY ||
      ""
    );
  }

  return (
    process.env.STRIPE_SECRET_KEY_LIVE ||
    process.env.STRIPE_SECRET_KEY ||
    ""
  );
}

/** Publishable key for client/config use. */
export function getStripePublishableKey() {
  if (isLocalDev()) {
    return (
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LOCAL ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      ""
    );
  }

  return (
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    ""
  );
}

/** Webhook signing secret for the matching environment. */
export function getStripeWebhookSecret() {
  if (isLocalDev()) {
    return (
      process.env.STRIPE_WEBHOOK_SECRET_LOCAL ||
      process.env.STRIPE_WEBHOOK_SECRET ||
      ""
    );
  }

  return (
    process.env.STRIPE_WEBHOOK_SECRET_LIVE ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    ""
  );
}

export function getStripe() {
  const key = getStripeSecretKey();
  if (!key) return null;
  return new Stripe(key);
}

export function randomCheckoutSuffix(length = 8) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
