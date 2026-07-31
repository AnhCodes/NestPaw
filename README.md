# NestPaw

**NestPaw** is a U.S.-first store for calm, comfort, and grooming tools that help people care better for their dogs at home.

**Locked stack:** Alibaba / CJ wholesale + NestPaw (Next.js) + Stripe + Postgres + Resend  
Zendrop / Shopify are **not** part of the plan.

Live store: [https://shopnestpaw.com](https://shopnestpaw.com)

---

## What this repo contains

```
NestPaw/
├── README.md
├── TODO.md                           # Active launch checklist
├── business/
│   ├── PACK-SHIP.md                  # Per-order pack → Pirate Ship → USPS → admin
│   ├── nestpaw-product-catalog.pdf   # Sell prices, Alibaba costs, suppliers, links
│   └── generate-catalog.py
└── store/                            # Next.js storefront + /admin
```

---

## Locked defaults

| Lever | Choice |
|-------|--------|
| Market | United States |
| Store | NestPaw Next.js (`store/`) |
| Payments | Stripe Checkout |
| Database | Postgres (local + Neon on Vercel) |
| Email | Resend (`hello@shopnestpaw.com`) |
| Supply | CJ / Alibaba samples → Alibaba bulk for winners |
| Fulfillment | Self-ship week 1 (USPS), 3PL later if needed |
| Shipping | $4.95 under $40 · free over $40 |
| Catalog | Brush kit, snuffle mat, slow feeder, nail grinder, lick mat |

---

## End-to-end flow

### 1. Source inventory
1. Choose products from [business/nestpaw-product-catalog.pdf](business/nestpaw-product-catalog.pdf).
2. Order samples / wholesale on Alibaba or CJ.
3. Log the purchase in `/admin` (vendor, items, quantities, cost).

### 2. Receive, QA, and stock
1. Inspect quality, sizing, pack contents, and real package weight/size.
2. Update admin inventory, then **Sync to storefront** so customers can only buy sellable stock.
3. Prep packing supplies, calm tips cards, and return-address labels.

### 3. Customer buys
1. Customer shops on [shopnestpaw.com](https://shopnestpaw.com) → cart → Stripe Checkout.
2. Stripe charges the card and can send a payment / receipt email.
3. The Stripe webhook creates the customer + order in Postgres and decrements stock.
4. The order appears in `/admin/orders` as **unfulfilled**.

### 4. Pack and ship

Follow **[PACK-SHIP.md](business/PACK-SHIP.md)** for the full checklist. Short version:

1. Open the order in `/admin/orders/[id]`.
2. Pack the product(s), tips card, and ship via USPS Ground Advantage through Pirate Ship.
3. Aim for all-in postage near the $4.95 flat rate on single orders, funded by margin on free-shipping carts.
4. In admin, set fulfillment to **shipped** and paste the tracking number (triggers the customer email).

### 5. Notify and deliver

1. NestPaw emails the customer from `hello@shopnestpaw.com` with tracking and a USPS link.
2. Most U.S. deliveries arrive in about 5 to 8 business days.
3. Returns / issues come through the Contact page and are handled in admin + Stripe.


```text
Alibaba → Receive & QA → Admin stock → Sync storefront
                 ↓
        Customer checkout (Stripe)
                 ↓
     Pack & ship (USPS) → Save tracking
                 ↓
     Shipping email → Customer receives
```

---

## Local development

```bash
cd store
cp .env.example .env.local   # fill Stripe, Resend, DATABASE_URL, admin password
npm install
npm run dev
```

- Storefront: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Useful scripts:

```bash
cd store
npm run build    # production build check
npm run lint     # lint
```

---

## Important env vars

See `store/.env.example` for the full list. Key ones:

| Variable | Purpose |
|----------|---------|
| `STRIPE_*_LOCAL` / `STRIPE_*_LIVE` | Checkout + webhooks |
| `NEXT_PUBLIC_SITE_URL` | Production site URL |
| `DATABASE_URL` | Postgres / Neon |
| `RESEND_API_KEY` | Contact + shipping emails |
| `CONTACT_FROM_EMAIL` | Verified sender, e.g. `NestPaw <hello@shopnestpaw.com>` |
| `CONTACT_TO_EMAIL` | Inbox for contact form + shipping reply-to |
| `ADMIN_PASSWORD` | `/admin` login |

---

## Next actions

See **[TODO.md](TODO.md)** for the live checklist. Immediate focus:

1. Finish Alibaba sample orders and QA.
2. Smoke-test checkout, admin, and Resend shipping email.
3. Soft-launch and fulfill manually from `/admin/orders`.
