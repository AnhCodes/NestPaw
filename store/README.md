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
2. Copy **Secret key** → `STRIPE_SECRET_KEY`  
3. Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional for hosted Checkout)  
4. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`  
5. Checkout creates a Stripe Checkout Session and redirects to Stripe-hosted payment.

Without keys, checkout shows a clear setup message (no fake charges).

## Stock

Edit `stock` on each product in `src/lib/products.ts`. All start at `0` until samples/wholesale arrive.

## What's included

- Home, Shop, PDPs, Cart, Stripe Checkout, success page  
- About, Shipping & returns, Contact, Privacy  
