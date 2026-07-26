# NestPaw — To-do

## While samples / inquiries finish

- [ ] Finalize inquiries on Alibaba and buy sample stock
- [ ] Deploy store to Vercel (`store/` as root directory)
- [ ] Create / finish Stripe account activation (business details, bank payout)
- [ ] Copy **test** keys into `store/.env.local` and run a full local test checkout
- [ ] Add Stripe env vars + `NEXT_PUBLIC_SITE_URL` on Vercel (Preview + Production)
- [ ] Verify success / cancel redirects on a Preview URL
- [ ] Wire contact form to real email (Resend, Formspree, or mailto + helpdesk) — currently demo-only
- [ ] Improve product image quality on catalog / PDPs
- [ ] Basic SEO: unique titles/descriptions, Open Graph image, `sitemap.xml` / `robots.txt`
- [ ] Soft-launch smoke test: shop → cart → Stripe test pay → success page on mobile + desktop

## When inventory arrives (before flipping “live”)

- [ ] QA samples (quality, sizing notes, pack contents, real ship times)
- [ ] Update `stock` in `store/src/lib/products.ts` from `0` to real counts
- [ ] Confirm shipping & returns copy matches real carrier / timeline / return address
- [ ] Decide fulfillment path for week 1 (self-ship vs 3PL) and write a 1-page pack/ship checklist
- [ ] Set up packing supplies + return address label
- [ ] Buy domain and point it at Vercel; update `NEXT_PUBLIC_SITE_URL`
- [ ] Switch Stripe to **live** keys (`sk_live_` / `pk_live_`) on Vercel
- [ ] Turn on Stripe email receipts / Dashboard notifications so every order is seen

## Launch week

- [ ] One real $1–full-price test order to yourself, then refund
- [ ] Soft-launch (friends/family or small ad) and fulfill manually
- [ ] (Optional) Stripe webhook for `checkout.session.completed` → order log / Slack / email
- [ ] (Optional) Simple analytics (Vercel Analytics or Plausible) to see traffic → checkout

## Ongoing (not launch blockers)

- [ ] Improve broader SEO after first sales data
- [ ] Reorder winners in bulk once samples convert
