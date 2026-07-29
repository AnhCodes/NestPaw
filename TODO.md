# NestPaw — To-do

## Up next

- [ ] Finalize inquiries on Alibaba and buy sample stock
- [ ] Finish Stripe account activation (business details, bank payout)
- [ ] Accept Neon Marketplace terms + `vercel integration add neon`
- [ ] Add Vercel env vars: Stripe, Resend, `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, `ADMIN_PASSWORD`
- [ ] Run `npm run db:push` + `npm run db:seed` against the hosted database
- [ ] Verify success / cancel redirects on a Preview URL
- [ ] Point deployed Stripe webhook at `/api/stripe-webhook` with the live `STRIPE_WEBHOOK_SECRET`
- [ ] Smoke-test `/admin` login, inventory editing, and order persistence from a test checkout

## Pre-launch polish

- [ ] Soft-launch smoke test: shop → cart → Stripe test pay → success page on mobile + desktop

## When inventory arrives

- [ ] QA samples (quality, sizing notes, pack contents, real ship times)
- [ ] Set live stock in `/admin/inventory`
- [ ] Confirm shipping & returns copy matches real carrier / timeline / return address
- [ ] Decide week-1 fulfillment path (self-ship vs 3PL) and write a pack/ship checklist
- [ ] Set up packing supplies + return address label
- [ ] Buy domain and point it at Vercel; update `NEXT_PUBLIC_SITE_URL`
- [ ] Switch Stripe to **live** keys on Vercel
- [ ] Turn on Stripe email receipts / Dashboard notifications
- [ ] Verify Resend sender domain (so contact form can email beyond your account inbox)

## Launch week

- [ ] One real $1–full-price test order to yourself, then refund
- [ ] Soft-launch (friends/family or small ad) and fulfill manually via `/admin/orders`
- [ ] Add simple analytics (Vercel Analytics or Plausible)

## Later

- [ ] Improve broader SEO after first sales data
- [ ] Reorder winners in bulk once samples convert
