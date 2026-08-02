# NestPaw Store

Professional Next.js storefront for NestPaw — premium dog comfort brand.

**Locked stack:** CJ / Alibaba wholesale inventory + this NestPaw site + **Stripe Checkout** (no Zendrop / no Shopify required).

## Run locally

```bash
cd store
npm install
cp .env.example .env.local   # add Stripe keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stripe

1. Create a [Stripe account](https://dashboard.stripe.com/register) (or sandbox).  
2. Copy **Test Secret key** → `STRIPE_SECRET_KEY_LOCAL` and **Test Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LOCAL`
3. Copy **Live Secret key** → `STRIPE_SECRET_KEY_LIVE` and **Live Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE` (for Vercel Production)
4. Set `NEXT_PUBLIC_SITE_URL=https://shopnestpaw.com` and `NEXT_PUBLIC_SITE_URL_LOCAL=http://localhost:3000`
5. Checkout creates a Stripe Checkout Session and redirects to Stripe-hosted payment.

Without keys, checkout shows a clear setup message (no fake charges).

## Stock

Live stock lives in Postgres (`inventory` table). Edit it in **[/admin/inventory](http://localhost:3000/admin)** after signing in with `ADMIN_PASSWORD`. Catalog copy still lives in `src/lib/products.ts`.

```bash
# First-time local DB
createdb nestpaw   # or use Neon DATABASE_URL
npm run db:push
npm run db:seed
npm run db:seed-order   # sample paid order for admin fulfillment testing
```

## Admin

1. Set `DATABASE_URL`, `ADMIN_PASSWORD` (and optional `ADMIN_SESSION_SECRET`) in `.env.local`
2. Open [http://localhost:3000/admin](http://localhost:3000/admin)
3. Manage orders, customers, inventory, and revenue overview

Production: accept Neon Marketplace terms, then `vercel integration add neon --plan free_v3`, and set admin env vars on Vercel.

## What's included

- Home, Shop, PDPs, Cart, Stripe Checkout, success page  
- About, Shipping & returns, Contact, Privacy  
- Internal `/admin` dashboard (password-gated)  
