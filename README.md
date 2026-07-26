# Premium Dog Comfort — NestPaw

**Locked stack:** **CJ / Alibaba wholesale + NestPaw (Next.js) + Stripe**  
Zendrop / Shopify are **not** part of the plan.

Working brand: **NestPaw** — calm · comfort · groom accessories for dogs at home (U.S.-first).

---

## Folder structure

```
Dropshipping Business/
├── README.md
├── TODO.md                           # Active to-do list
├── business/
│   ├── nestpaw-product-catalog.pdf   # Sell prices, Alibaba costs, suppliers, links
│   └── generate-catalog.py           # Regenerate the PDF (python3 generate-catalog.py)
└── store/                            # NestPaw Next.js site
```

---

## Start here

1. **[Product & sourcing catalog (PDF)](business/nestpaw-product-catalog.pdf)** — what we sell, NestPaw prices, Alibaba costs, producers, and links  
2. **[store/](store/)** — NestPaw website (`cd store && npm run dev`)  
3. **[TODO.md](TODO.md)** — active to-do list

---

## Locked defaults

| Lever | Choice |
|-------|--------|
| Market | United States |
| Store | NestPaw Next.js (`store/`) |
| Payments | Stripe Checkout |
| Supply | CJ samples/wholesale → Alibaba bulk for winners |
| Fulfillment | Self-ship or 3PL (not Zendrop) |
| Price band | Mostly $24–$35 (floor at ≥$12 contribution) |
| Catalog | **Core 4** — brush kit, snuffle (+ Calm Evening bundle), slow feeder, nail grinder |

---

## Next actions

See **[TODO.md](TODO.md)** for the live checklist. Baseline launch steps:

1. Order samples via Alibaba/CJ using [nestpaw-product-catalog.pdf](business/nestpaw-product-catalog.pdf).  
2. Add Stripe keys to `store/.env.local`.  
3. Set product `stock` when inventory arrives.  
4. Soft-launch and fulfill manually.
