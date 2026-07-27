# NestPaw — To-do

## Before soft launch

- [ ] Finalize inquiries on Alibaba and buy sample stock
- [ ] Finish Stripe account activation (business details, bank payout)
- [ ] Add Stripe + Resend env vars and `NEXT_PUBLIC_SITE_URL` on Vercel (Preview + Production)
- [ ] Verify success / cancel redirects on a Preview URL
- [ ] Improve product image quality on catalog / PDPs
- [ ] Soft-launch smoke test: shop → cart → Stripe test pay → success page on mobile + desktop
- [ ] Point deployed Stripe webhook at `/api/stripe-webhook` (use live `STRIPE_WEBHOOK_SECRET`)

## When inventory arrives

- [ ] QA samples (quality, sizing notes, pack contents, real ship times)
- [ ] Update `stock` in `store/src/lib/products.ts` to real counts
- [ ] Confirm shipping & returns copy matches real carrier / timeline / return address
- [ ] Decide week-1 fulfillment path (self-ship vs 3PL) and write a pack/ship checklist
- [ ] Set up packing supplies + return address label
- [ ] Buy domain and point it at Vercel; update `NEXT_PUBLIC_SITE_URL`
- [ ] Switch Stripe to **live** keys on Vercel
- [ ] Turn on Stripe email receipts / Dashboard notifications
- [ ] Verify Resend sender domain (so contact form can email beyond your account inbox)

## Launch week

- [ ] One real $1–full-price test order to yourself, then refund
- [ ] Soft-launch (friends/family or small ad) and fulfill manually
- [ ] (Optional) Simple analytics (Vercel Analytics or Plausible)

## Internal admin dashboard (post-launch OK)

- [ ] Plan data model (orders, customers, products, inventory, fulfillment, tracking)
- [ ] Add admin auth / protected routes
- [ ] Orders view (customer info, items, totals, payment + shipping details)
- [ ] Customer view (history + contact/shipping info)
- [ ] Inventory editor (stock updates + low-stock warnings)
- [ ] Fulfillment workflow (unfulfilled → packed → shipped → delivered + tracking)
- [ ] Revenue summary (sales, order count, average order value)

## Ongoing

- [ ] Improve broader SEO after first sales data
- [ ] Reorder winners in bulk once samples convert

## Progress log

### 2026-07-27

- Local Stripe test keys + full checkout → success page
- Cart hydration fix (`getServerSnapshot`)
- Checkout / success page copy cleanup
- Stripe webhook route + local order logging (`order-logs/orders.jsonl`)
- Contact form via Resend (verified end-to-end)
- Basic SEO: titles/descriptions, Open Graph image, sitemap, robots
