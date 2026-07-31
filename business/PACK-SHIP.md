# NestPaw — Pack & ship checklist

Week-1 fulfillment is **self-ship** via [Pirate Ship](https://www.pirateship.com/) + **USPS Ground Advantage** (not 3PL).

Use this for every paid order until a 3PL is intentionally adopted later.

---

## Before you start (one-time setup)

- [x] Pirate Ship account created and payment method added
- [x] One test label bought (printed + refunded; ~$7.56 for ~1 lb 10 oz poly mailer)
- [x] Packing supplies on hand (boxes or poly mailers, filler, tape)
- [x] Return-address labels ready (NestPaw / your ship-from address)
- [ ] Printed calm tips cards ready (`store/public/packaging/nestpaw-calm-tips-card.png`)
- [ ] Thermal labels optional later; paper labels from Pirate Ship are fine for week 1
- [ ] Bookmark [https://shopnestpaw.com/admin/orders](https://shopnestpaw.com/admin/orders)

**Target postage:** keep single-item Ground Advantage near the **$4.95** flat shipping rate when possible; free-shipping carts ($40+) are funded by product margin.

---

## Per order

### 1. Pull the order

1. Open [Admin → Orders](https://shopnestpaw.com/admin/orders).
2. Open the **unfulfilled** order.
3. Confirm:
   - Product(s) and quantity
   - Customer email
   - Shipping name, phone, and address
4. Keep the order tab open — you will paste tracking here after the label.

### 2. Pick and pack

1. Pull the exact SKU(s) from inventory.
2. Quick QA: no damage, correct item, complete kit parts (for example brush + glove).
3. Add one **dog calm tips card**.
4. Pack with enough filler so the item cannot rattle or bend.
5. Seal the package; apply return-address label if it is not printed on the carrier label.

**What’s included (storefront promise):**

| Product | Pack with |
|---------|-----------|
| Shedding brush kit | Deshedding brush, grooming glove, tips card |
| Forage Snuffle Mat | Snuffle mat, tips card |
| Silicone Slow Feeder Mat | Slow-feeder mat, tips card |
| Quiet Nail Grinder | Grinder, USB cable, tips card |
| Suction Lick Mat | Lick mat, tips card |

### 3. Buy the label (Pirate Ship)

1. Create a new shipment in Pirate Ship.
2. Paste the customer address from admin (double-check ZIP and apartment).
3. Enter package weight and dimensions from a real scale / ruler when possible.
4. Choose **USPS Ground Advantage** (default week-1 service).
5. Buy the label and print it.
6. Affix the label flat; do not cover barcodes.

### 4. Hand off to USPS

1. Drop at a USPS retail counter, collection box (if label rules allow), or scheduled pickup.
2. Keep the receipt / Pirate Ship confirmation until the package shows a first scan.
3. Aim to ship within **24 hours** of payment when stock is on hand.

### 5. Mark shipped in NestPaw admin

1. Back on the order detail page in `/admin/orders/[id]`.
2. Set fulfillment status to **shipped**.
3. Paste the **tracking number** (required for the customer email).
4. Save.

NestPaw will email the customer from `hello@shopnestpaw.com` with tracking and a USPS link when status is **shipped** and tracking is present.

5. Confirm the admin banner shows the shipping email as **sent** (not “needs tracking” or error).
6. If email failed, fix Resend / domain config, then re-save only if the app allows a fresh send — otherwise email the customer manually with the tracking number.

### 6. Aftercare

- [ ] First USPS scan appears (usually same day or next business day)
- [ ] Customer can open the tracking link
- [ ] Returns / issues come through [Contact](https://shopnestpaw.com/contact) and are handled in admin + Stripe refunds if needed

---

## Station checklist (keep stocked)

- [ ] Poly mailers and/or small boxes
- [ ] Packing paper / filler
- [ ] Packing tape
- [ ] Return-address labels
- [ ] Calm tips cards
- [ ] Scale (phone scale is fine at first)
- [ ] Printer for Pirate Ship labels
- [ ] Spare USB cable for nail-grinder orders

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| No unfulfilled orders | Confirm Stripe webhook created the order; check `/admin/orders` after a paid checkout |
| Address looks wrong | Message the customer via Contact / email before buying postage |
| Tracking email did not send | Status must be `shipped` **and** tracking filled; check Resend logs for `hello@shopnestpaw.com` |
| Postage much over $4.95 | Re-check dimensions/weight; consider poly mailer; note for pricing later |
| Package damaged in transit | Ask for photos within 7 days; replace or refund per shipping policy |

---

## Related

- Launch tasks: [TODO.md](TODO.md)
- Full pipeline: [README.md](README.md)
- Tips card artwork: `store/public/packaging/nestpaw-calm-tips-card.png`
- Editable tips card source: `store/public/packaging/nestpaw-calm-tips-card.html`
