#!/usr/bin/env python3
"""Generate NestPaw end-to-end fulfillment pipeline PDF."""

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    CondPageBreak,
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parents[1] / "pdfs" / "nestpaw-fulfillment-pipeline.pdf"

# Match catalog palette
MOSS = HexColor("#1f3d32")
MOSS_SOFT = HexColor("#2d5a47")
ACCENT = HexColor("#246048")
INK = HexColor("#1a1f1c")
MUTED = HexColor("#5c6b63")
LINE = HexColor("#d5ddd7")
RULE = HexColor("#c5cec8")
BG = HexColor("#f4f7f5")
BG_CARD = HexColor("#fafbfa")


def nb(*words: str) -> str:
    """Join words with non-breaking spaces to avoid runts/widows."""
    return "\u00a0".join(words)


def build_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "DocTitle",
            fontName="Helvetica-Bold",
            fontSize=20,
            textColor=MOSS,
            leading=24,
            spaceAfter=4,
        ),
        "lede": ParagraphStyle(
            "Lede",
            fontName="Helvetica",
            fontSize=9.5,
            textColor=MUTED,
            leading=13,
            spaceAfter=10,
            alignment=TA_LEFT,
        ),
        "h2": ParagraphStyle(
            "H2",
            fontName="Helvetica-Bold",
            fontSize=11,
            textColor=MOSS,
            leading=13.5,
            spaceBefore=0,
            spaceAfter=5,
            keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "H3",
            fontName="Helvetica-Bold",
            fontSize=9.5,
            textColor=ACCENT,
            leading=12,
            spaceBefore=6,
            spaceAfter=2,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "Body",
            fontName="Helvetica",
            fontSize=9,
            textColor=INK,
            leading=12,
            spaceAfter=3,
            alignment=TA_LEFT,
        ),
        "step": ParagraphStyle(
            "Step",
            fontName="Helvetica",
            fontSize=9,
            textColor=INK,
            leading=12,
            spaceBefore=0.5,
            spaceAfter=2.5,
            leftIndent=16,
            firstLineIndent=-16,
            alignment=TA_LEFT,
        ),
        "small": ParagraphStyle(
            "Small",
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            leading=11,
            spaceAfter=2,
        ),
        "callout": ParagraphStyle(
            "Callout",
            fontName="Helvetica",
            fontSize=8.5,
            textColor=INK,
            leading=11.5,
            alignment=TA_LEFT,
        ),
        "flow": ParagraphStyle(
            "Flow",
            fontName="Helvetica",
            fontSize=8,
            textColor=white,
            leading=12,
            alignment=TA_CENTER,
        ),
        "meta_label": ParagraphStyle(
            "MetaLabel",
            fontName="Helvetica-Bold",
            fontSize=7,
            textColor=ACCENT,
            leading=9,
            alignment=TA_CENTER,
            spaceAfter=2,
        ),
        "meta": ParagraphStyle(
            "Meta",
            fontName="Helvetica",
            fontSize=8,
            textColor=INK,
            leading=10.5,
            alignment=TA_CENTER,
        ),
        "th": ParagraphStyle(
            "TH",
            fontName="Helvetica-Bold",
            fontSize=7.5,
            textColor=white,
            leading=9.5,
        ),
        "td": ParagraphStyle(
            "TD",
            fontName="Helvetica",
            fontSize=8,
            textColor=INK,
            leading=10.5,
        ),
        "footer": ParagraphStyle(
            "FooterNote",
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            leading=11,
            spaceBefore=8,
        ),
    }


def steps(items, s):
    """Numbered steps as hanging-indent paragraphs (avoids ListFlowable glitches)."""
    out = []
    for i, text in enumerate(items, 1):
        out.append(Paragraph(f"<b>{i}.</b>  {text}", s["step"]))
    return out


def callout(text, s):
    inner = Paragraph(text, s["callout"])
    t = Table([[inner]], colWidths=[7.0 * inch])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BG),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("LINEBEFORE", (0, 0), (0, -1), 2.5, ACCENT),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return t


def grid(headers, rows, s, col_widths=None):
    data = [[Paragraph(h, s["th"]) for h in headers]]
    for row in rows:
        data.append([Paragraph(c, s["td"]) for c in row])
    widths = col_widths or [2.15 * inch, 4.85 * inch]
    t = Table(data, colWidths=widths, repeatRows=1)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), MOSS),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            cmds.append(("BACKGROUND", (0, i), (-1, i), BG))
    t.setStyle(TableStyle(cmds))
    return t


def section(title, s, *parts, min_space=1.2 * inch):
    """Start a section only if enough room remains for the heading + first content."""
    return [
        CondPageBreak(min_space),
        Paragraph(title, s["h2"]),
        *parts,
        Spacer(1, 3),
    ]


def hr():
    return HRFlowable(
        width="100%", thickness=0.6, color=RULE, spaceBefore=2, spaceAfter=8
    )


def build():
    s = build_styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.7 * inch,
        rightMargin=0.7 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.7 * inch,
        title="NestPaw Fulfillment Pipeline",
        author="NestPaw",
    )

    story = []

    # —— Header ——
    story.append(Paragraph("NestPaw Fulfillment Pipeline", s["title"]))
    story.append(
        Paragraph(
            "End-to-end operating guide: buy wholesale stock, publish sellable inventory, "
            "take the Stripe order, pack, buy a USPS label on Pirate Ship, mark shipped, "
            "and send the customer tracking email. Week-1 model is "
            f"<b>self-ship from your NestPaw U.S. ship-from address</b> "
            f"(Pirate Ship + USPS Ground Advantage). No 3PL yet.",
            s["lede"],
        )
    )

    meta = Table(
        [
            [
                Paragraph("STORE", s["meta_label"]),
                Paragraph("ADMIN", s["meta_label"]),
                Paragraph("CARRIER", s["meta_label"]),
                Paragraph("EMAIL", s["meta_label"]),
            ],
            [
                Paragraph("shopnestpaw.com<br/>Next.js · Stripe · Neon", s["meta"]),
                Paragraph("/admin/orders<br/>/admin/inventory", s["meta"]),
                Paragraph("USPS Ground Advantage<br/>via Pirate Ship", s["meta"]),
                Paragraph("orders@shopnestpaw.com<br/>via Resend", s["meta"]),
            ],
        ],
        colWidths=[1.75 * inch] * 4,
    )
    meta.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BG),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, 0), 7),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 1),
                ("TOPPADDING", (0, 1), (-1, 1), 2),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(meta)
    story.append(Spacer(1, 10))

    flow_lines = [
        "Buy stock → Receive &amp; QA → Log purchase → Set stock → Sync storefront",
        "Customer checkout (Stripe) → Webhook creates order → Stock decrements",
        "Admin: unfulfilled → Pick / pack + tips card → Pirate Ship label → USPS",
        "Mark shipped + tracking → Resend email → Customer receives (5–8 days)",
    ]
    flow = Table(
        [[Paragraph(line, s["flow"])] for line in flow_lines],
        colWidths=[7.0 * inch],
    )
    flow.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), MOSS),
                ("TOPPADDING", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
                ("TOPPADDING", (0, 1), (-1, -2), 2),
                ("BOTTOMPADDING", (0, 1), (-1, -2), 2),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(flow)
    story.append(Spacer(1, 12))

    # —— 0 ——
    story.extend(
        section(
            "0 · Locked defaults",
            s,
            grid(
                ["Lever", "Choice"],
                [
                    ["Market", "United States only"],
                    ["Supply", "Alibaba / CJ samples first → Alibaba bulk for winners"],
                    ["Payments", "Stripe Checkout (live mode on production)"],
                    ["Database", "Postgres (Neon on Vercel)"],
                    [
                        "Fulfillment",
                        "Self-ship week 1; 3PL only if volume later requires it",
                    ],
                    [
                        "Customer shipping",
                        f"$5.50 under $40 · free over $40",
                    ],
                    [
                        "Postage target",
                        f"Keep single-item Ground Advantage near $5.50; free-shipping carts funded by margin",
                    ],
                    [
                        "Site promise",
                        f"Ships within 24 hours · arrives in 5–8 business days · 30-day returns",
                    ],
                ],
                s,
            ),
            min_space=1.2 * inch,
        )
    )

    # —— 1 ——
    story.extend(
        section(
            "1 · Buy stock (wholesale)",
            s,
            Paragraph(
                "Start here every time you need inventory — before anything can sell "
                f"on the {nb('storefront.')}",
                s["body"],
            ),
            *steps(
                [
                    f"Open the product catalog: <b>business/pdfs/nestpaw-product-catalog.pdf</b> "
                    f"(sell prices, Alibaba costs, {nb('supplier', 'links')}).",
                    "Choose SKUs to order (samples first; bulk only after a product converts).",
                    "Place the order on <b>Alibaba</b> or <b>CJ</b> to your NestPaw ship-from / warehouse address.",
                    f"Save the supplier invoice / order confirmation for {nb('cost', 'tracking')}.",
                    "In NestPaw admin, log the purchase under <b>Inventory → Purchases</b> "
                    "(vendor, items, quantities, costs, lead time, MOQ).",
                ],
                s,
            ),
            Spacer(1, 4),
            callout(
                "<b>Catalog SKUs:</b> Shedding Brush Kit ($29) · Forage Snuffle Mat ($44) · "
                "Silicone Slow Feeder Mat ($29) · Quiet Nail Grinder ($29) · Suction Lick Mat ($14). "
                f"Kits use warehouse parts (brush kit = deshedding brush + grooming {nb('glove')}).",
                s,
            ),
            min_space=1.2 * inch,
        )
    )

    # —— 2 ——
    story.append(CondPageBreak(2.2 * inch))
    story.append(Paragraph("2 · Receive, QA, and publish stock", s["h2"]))
    story.append(Paragraph("2a · Physical receive &amp; QA", s["h3"]))
    story.append(
        KeepTogether(
            steps(
                [
                    "When the carton arrives, count units against the purchase order.",
                    "Inspect each sample/SKU for quality, sizing vs storefront photos, pack contents "
                    "(brush + glove for the kit; USB cable for the nail grinder), and real package "
                    f"weight/dimensions for accurate {nb('Pirate', 'Ship', 'rates.')}",
                    f"Set aside defective units — do not publish them as storefront {nb('stock.')}",
                ],
                s,
            )
        )
    )
    story.append(Paragraph("2b · Update warehouse inventory", s["h3"]))
    story.append(
        KeepTogether(
            steps(
                [
                    "Open <b>https://shopnestpaw.com/admin/inventory</b>.",
                    "Set <b>warehouse stock</b> for each part/SKU to the sellable count after QA.",
                    "For kits, ensure component parts have stock (kit availability is derived from parts).",
                ],
                s,
            )
        )
    )
    story.append(Paragraph("2c · Sync to storefront", s["h3"]))
    story.append(
        KeepTogether(
            [
                *steps(
                    [
                        "Use <b>Sync to storefront</b> so storefront stock matches what customers may buy.",
                        "On <b>https://shopnestpaw.com/shop</b>, confirm in-stock items show counts "
                        "and sold-out items cannot be added to cart.",
                    ],
                    s,
                ),
                Spacer(1, 4),
                callout(
                    "Customers can only buy <b>storefront stock</b>. Warehouse stock alone does not sell. "
                    f"Always sync after receiving {nb('inventory.')}",
                    s,
                ),
            ]
        )
    )

    # —— 3 ——
    story.extend(
        section(
            "3 · Prep the packing station (before first sale)",
            s,
            grid(
                ["Item", "Why"],
                [
                    ["Poly mailers and/or small boxes", "Primary packaging"],
                    ["Packing paper / filler", "Prevent rattle and bend damage"],
                    ["Packing tape", "Seal boxes / reinforce mailers"],
                    [
                        "Return-address labels",
                        "NestPaw ship-from address (also set in Pirate Ship)",
                    ],
                    [
                        "Printed calm tips cards",
                        "Artwork: store/public/packaging/nestpaw-calm-tips-card.png",
                    ],
                    [
                        "Scale",
                        "Accurate Pirate Ship weight (phone scale fine at first)",
                    ],
                    ["Printer", "Print Pirate Ship labels (thermal optional later)"],
                    ["Spare USB cables", "Required for Quiet Nail Grinder orders"],
                ],
                s,
            ),
            Spacer(1, 3),
            Paragraph(
                "Pirate Ship account, payment method, and one refunded test label "
                f"should already be {nb('done.')}",
                s["small"],
            ),
            min_space=1.2 * inch,
        )
    )

    # —— 4 ——
    story.extend(
        section(
            "4 · Customer places the order",
            s,
            *steps(
                [
                    "Customer browses shopnestpaw.com → product page → cart → checkout.",
                    "NestPaw checkout shows the order summary and redirects to <b>Stripe Checkout</b>. "
                    "Stripe collects email, phone, shipping address, and payment — NestPaw does not "
                    f"collect email on its own checkout {nb('page.')}",
                    "Stripe charges the card and can send the customer a Stripe receipt "
                    f"(if enabled in {nb('Dashboard')}).",
                    "You get a payment notification via the Stripe mobile app "
                    f"(successful payments + {nb('payouts')}).",
                ],
                s,
            ),
            min_space=1.2 * inch,
        )
    )

    # —— 5 ——
    story.extend(
        section(
            "5 · Order lands in NestPaw (automatic)",
            s,
            *steps(
                [
                    "Stripe fires <b>checkout.session.completed</b> to "
                    "https://shopnestpaw.com/api/stripe-webhook.",
                    "NestPaw verifies the webhook signature, then creates/updates the customer, "
                    "creates the order with line items + shipping address, sets fulfillment to "
                    f"<b>unfulfilled</b>, and <b>decrements storefront stock</b> for paid {nb('items.')}",
                    "Order appears in <b>/admin/orders</b>.",
                ],
                s,
            ),
            Spacer(1, 4),
            callout(
                "If an order never appears after a real paid checkout, the webhook failed — check "
                "Stripe Dashboard → Developers → Webhooks, then Vercel / Neon. Do not ship from a "
                f"Stripe payment alone without an admin {nb('order.')}",
                s,
            ),
            min_space=1.2 * inch,
        )
    )

    # —— 6 ——
    story.extend(
        section(
            "6 · Pull the order in admin",
            s,
            *steps(
                [
                    "Open https://shopnestpaw.com/admin/orders (bookmark this).",
                    "Open the <b>unfulfilled</b> order in the detail view.",
                    "Confirm products, quantity, customer email, and the full shipping address "
                    "(name, phone, street, city, state, ZIP, apartment).",
                    "Keep the order tab open — you will paste tracking here after the label.",
                ],
                s,
            ),
            min_space=1.2 * inch,
        )
    )

    # —— 7 ——
    story.extend(
        section(
            "7 · Pick and pack",
            s,
            *steps(
                [
                    "Pull the exact SKU(s) from physical inventory.",
                    "Quick QA again: no damage, correct item, complete kit parts.",
                    "Add <b>one dog calm tips card</b> to every package.",
                    "Pack with enough filler so the item cannot rattle or bend.",
                    "Seal the package; apply a return-address label if the carrier label does not "
                    f"already print {nb('one.')}",
                ],
                s,
            ),
            Spacer(1, 3),
            grid(
                ["Product", "Must pack with"],
                [
                    [
                        "Shedding Brush Kit",
                        "Deshedding brush, grooming glove, tips card",
                    ],
                    ["Forage Snuffle Mat", "Snuffle mat, tips card"],
                    ["Silicone Slow Feeder Mat", "Slow-feeder mat, tips card"],
                    ["Quiet Nail Grinder", "Grinder, USB cable, tips card"],
                    ["Suction Lick Mat", "Lick mat, tips card"],
                ],
                s,
            ),
            min_space=1.2 * inch,
        )
    )

    # —— 8 ——
    story.extend(
        section(
            "8 · Buy the shipping label (Pirate Ship)",
            s,
            *steps(
                [
                    "Create a new shipment in <b>Pirate Ship</b>.",
                    "Confirm ship-from = NestPaw return / warehouse address.",
                    "Paste the customer address from admin (double-check ZIP and apartment).",
                    "Enter real package weight and dimensions from the scale / ruler.",
                    "Choose <b>USPS Ground Advantage</b> (default week-1 service).",
                    "Buy the label and print it.",
                    "Affix the label flat without covering any barcodes.",
                ],
                s,
            ),
            Spacer(1, 4),
            callout(
                "Target: single-item Ground Advantage postage near the <b>$5.50</b> flat rate "
                "customers pay. Free-shipping carts ($40+) are funded by product margin. If postage "
                f"runs high, re-check weight/dimensions and prefer a poly {nb('mailer.')}",
                s,
            ),
            min_space=1.2 * inch,
        )
    )

    # —— 9 ——
    story.extend(
        section(
            "9 · Hand off to USPS",
            s,
            *steps(
                [
                    "Drop at a USPS retail counter, collection box (if label rules allow), or "
                    "scheduled pickup.",
                    "Keep the Pirate Ship confirmation / receipt until the package shows a first scan.",
                    "Aim to ship within <b>24 hours</b> of payment when stock is on hand "
                    f"(matches storefront {nb('copy')}).",
                ],
                s,
            ),
            min_space=1.2 * inch,
        )
    )

    # —— 10 ——
    story.extend(
        section(
            "10 · Mark shipped in NestPaw (triggers customer email)",
            s,
            *steps(
                [
                    "Return to the order detail page: /admin/orders/[orderId].",
                    "Set fulfillment status to <b>shipped</b>.",
                    "Paste the <b>tracking number</b> (required — email will not send without it).",
                    "Save.",
                    "Confirm the admin banner shows shipping email as <b>sent</b> "
                    f"(not “needs tracking”, “unchanged”, or {nb('error')}).",
                ],
                s,
            ),
            Spacer(1, 3),
            KeepTogether(
                [
                    Paragraph(
                        "NestPaw then emails the customer from "
                        "<b>NestPaw &lt;orders@shopnestpaw.com&gt;</b> "
                        "(“Your NestPaw order is on its way”) with greeting, order id, tracking, "
                        "USPS link, timing note, and Contact.",
                        s["body"],
                    ),
                    Spacer(1, 3),
                    callout(
                        "Same status + same tracking does <b>not</b> resend. "
                        "Change tracking to force a new send, or email the customer yourself.",
                        s,
                    ),
                ]
            ),
            min_space=1.2 * inch,
        )
    )

    # —— 11 ——
    story.extend(
        section(
            "11 · Delivery and aftercare",
            s,
            *steps(
                [
                    "Watch for first USPS scan (usually same day or next business day).",
                    "Most U.S. deliveries arrive in about <b>5 to 8 business days</b> "
                    f"after the package is {nb('shipped.')}",
                    "Questions and return requests come through https://shopnestpaw.com/contact, "
                    "land in your CONTACT_TO_EMAIL inbox via Resend, and set reply-to to the customer.",
                    "Handle returns in admin (return status) + Stripe refunds when needed.",
                    "Honor the 30-day return window for unused items in original condition.",
                ],
                s,
            ),
            min_space=1.2 * inch,
        )
    )

    # —— 12 ——
    story.extend(
        section(
            "12 · Soft-launch test order (run once when stock arrives)",
            s,
            *steps(
                [
                    "Set live storefront stock in /admin/inventory and sync.",
                    "Place one real paid order to yourself on production "
                    "(full price, or a small $1 test if you prefer).",
                    "Confirm Stripe charge → webhook → admin order → stock drop.",
                    "Pack, buy label, ship, then mark shipped with tracking.",
                    "Confirm the branded shipping email arrives from orders@shopnestpaw.com.",
                    "Refund the test order in Stripe when done.",
                    "Soft-launch to friends/family (or a small ad) and fulfill with this pipeline.",
                ],
                s,
            ),
            min_space=1.2 * inch,
        )
    )

    # —— Troubleshooting ——
    story.append(CondPageBreak(2.8 * inch))
    story.append(Paragraph("Troubleshooting quick reference", s["h2"]))
    story.append(
        grid(
            ["Problem", "What to do"],
            [
                [
                    "Paid order missing from admin",
                    "Check Stripe webhook delivery + Neon; confirm live webhook secret on Vercel",
                ],
                [
                    "Shop out of stock but warehouse has units",
                    "Publish / sync storefront stock in /admin/inventory",
                ],
                [
                    "Address looks wrong",
                    "Email the customer before buying postage",
                ],
                [
                    "Tracking email did not send",
                    "Need status=shipped AND tracking filled; check Resend for orders@",
                ],
                [
                    "Postage much over $5.50",
                    "Re-check weight/dimensions; try a poly mailer; note for pricing",
                ],
                [
                    "Package damaged in transit",
                    "Ask for photos within 7 days; replace or refund per policy",
                ],
                [
                    "Contact form not arriving",
                    "Confirm RESEND_API_KEY + CONTACT_FROM/TO_EMAIL in Vercel",
                ],
            ],
            s,
            col_widths=[2.5 * inch, 4.5 * inch],
        )
    )
    story.append(Spacer(1, 8))
    story.append(hr())
    story.append(
        Paragraph(
            "<b>Related docs:</b> README.md · business/PACK-SHIP.md · TODO.md · "
            "business/pdfs/nestpaw-product-catalog.pdf. "
            "Revise this PDF if fulfillment later moves to a 3PL.",
            s["footer"],
        )
    )

    def on_page(canvas, doc_):
        canvas.saveState()
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.5)
        y = 0.42 * inch
        canvas.line(0.7 * inch, y + 8, letter[0] - 0.7 * inch, y + 8)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(
            0.7 * inch, y, "NestPaw · Fulfillment pipeline · shopnestpaw.com"
        )
        canvas.drawRightString(letter[0] - 0.7 * inch, y, str(doc_.page))
        canvas.restoreState()

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    build()
