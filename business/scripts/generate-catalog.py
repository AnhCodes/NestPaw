#!/usr/bin/env python3
"""Generate NestPaw sourcing catalog PDF with clean typography."""

from datetime import date
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parents[1] / "pdfs" / "nestpaw-product-catalog.pdf"

# Palette
MOSS = HexColor("#1f3d32")
MOSS_SOFT = HexColor("#2d5a47")
INK = HexColor("#1a1f1c")
MUTED = HexColor("#5c6b63")
LINE = HexColor("#d5ddd7")
RULE = HexColor("#c5cec8")
BG = HexColor("#f4f7f5")
BG_CARD = HexColor("#fafbfa")
ACCENT = HexColor("#246048")

# Landed = cost to NestPaw (Alibaba + inbound). Outbound = est. US ship to customer.
# Free ship on NestPaw orders ≥ $40; customer pays $4.95 under. Solo-item orders.
FREE_SHIP_AT = 40.0
CUSTOMER_SHIP_FEE = 4.95
STRIPE_PCT = 0.029
STRIPE_FIXED = 0.30
RETURNS_PCT = 0.03

# Shedding Brush Kit components
# MHC gloves: Alibaba selling unit / MOQ band is a pack of 50 @ $0.56/pc (50–99 tier).
# Per NestPaw kit we only use 1 glove → amortize pack across 50 kits.
COMB_UNIT = 0.55  # Kinghon mid of $0.45–$0.60
GLOVE_UNIT = 0.56  # MHC $0.56 at 50–99 pcs
GLOVE_PACK_QTY = 50
GLOVE_PACK_COST = round(GLOVE_UNIT * GLOVE_PACK_QTY, 2)  # $28.00 cash for one pack
BRUSH_KIT_ALIBABA = round(COMB_UNIT + GLOVE_UNIT, 2)  # $1.11 per kit sold
BRUSH_KIT_INBOUND = 3.00  # est. China→NestPaw freight pad (planning)
BRUSH_KIT_LANDED = round(BRUSH_KIT_ALIBABA + BRUSH_KIT_INBOUND, 2)  # $4.11

STORE = [
    {
        "product": "Shedding Brush Kit",
        "sell": 24.0,
        "alibaba": BRUSH_KIT_ALIBABA,
        "alibaba_label": f"${BRUSH_KIT_ALIBABA:.2f}†",
        "landed": BRUSH_KIT_LANDED,  # to NestPaw
        "outbound": 5.50,  # est. USPS to customer
        "source": "Kinghon comb + 1 MHC glove",
    },
    {
        "product": "Forage Snuffle Mat",
        "sell": 28.0,
        "alibaba": 8.0,
        "alibaba_label": "$8.00",
        "landed": 14.0,
        "outbound": 7.00,
        "source": "Snuffle listing",
    },
    {
        "product": "Silicone Slow Feeder Mat",
        "sell": 34.0,
        "alibaba": 11.21,
        "alibaba_label": "$11.21",
        "landed": 18.0,
        "outbound": 6.50,
        "source": "Slow-feeder listing",
    },
    {
        "product": "Quiet Nail Grinder",
        "sell": 25.0,
        "alibaba": 5.69,
        "alibaba_label": "$5.69",
        "landed": 11.0,
        "outbound": 5.50,
        "source": "Nail-grinder listing",
    },
    {
        "product": "Calm Evening Bundle",
        "sell": 38.0,
        "alibaba": 12.0,
        "alibaba_label": "$12.00*",
        "landed": 20.0,
        "outbound": 8.00,
        "source": "Snuffle + lick (2 orders)",
    },
]


def money(n: float) -> str:
    return f"${n:.2f}"


def contribution(item: dict) -> float:
    """What NestPaw keeps on a solo-item order after outbound to customer."""
    ship_collected = 0.0 if item["sell"] >= FREE_SHIP_AT else CUSTOMER_SHIP_FEE
    charged = item["sell"] + ship_collected
    stripe = charged * STRIPE_PCT + STRIPE_FIXED
    returns = item["sell"] * RETURNS_PCT
    return charged - item["landed"] - item["outbound"] - stripe - returns


# One row per Alibaba SKU to buy (individual items — not NestPaw kits/bundles)
ORDERS = [
    {
        "n": "01",
        "name": "Hair Remove Comb",
        "tag": f"{money(COMB_UNIT)} / piece · used in Shedding Brush Kit",
        "listing": "Dog and Cat One-button Hair Remove Comb",
        "producer": "Yiwu Kinghon Pet Products Co. Ltd.",
        "badge": "Verified · 8 yrs",
        "cost": money(COMB_UNIT),
        "cost_note": "per piece",
        "stats": "1,840 sold · 4.8/5 (573) · #11 Pet Cleaning · MOQ ~50",
        "url": "https://www.alibaba.com/product-detail/Dog-and-Cat-One-button-Hair_1601126914170.html",
    },
    {
        "n": "02",
        "name": "Silicone Grooming Gloves",
        "tag": (
            f"{money(GLOVE_PACK_COST)} / pack of {GLOVE_PACK_QTY} "
            f"({money(GLOVE_UNIT)}/pc) · used in Shedding Brush Kit"
        ),
        "listing": "MHC Customizable Size Silicone Grooming Gloves",
        "producer": "Dongguan MHC Industrial Co. Ltd.",
        "badge": f"1 unit = pack of {GLOVE_PACK_QTY}",
        "cost": money(GLOVE_PACK_COST),
        "cost_note": f"pack of {GLOVE_PACK_QTY} pcs",
        "stats": f"50–99 tier @ {money(GLOVE_UNIT)}/pc · one pack covers {GLOVE_PACK_QTY} kits",
        "url": "https://www.alibaba.com/product-detail/MHC-Customizable-Size-Silicone-Grooming-Gloves_1601358986188.html",
    },
    {
        "n": "03",
        "name": "Forage Snuffle Mat",
        "tag": "$8.00 / piece · NestPaw $28 · also in Calm Evening Bundle",
        "listing": "LS OEM Waterproof Interactive Dog Foraging Mat",
        "producer": "Weihai L.S. / PEPPY BUDDIES",
        "badge": "Custom Mfr · 5 yrs",
        "cost": "$8.00",
        "cost_note": "per piece",
        "stats": "5.0/5 (128) · MOQ ~90–180",
        "url": "https://www.alibaba.com/product-detail/LS-OEM-Waterproof-Interactive-Dog-Foraging_1600772908467.html",
    },
    {
        "n": "04",
        "name": "Silicone Slow-Feeder Mat",
        "tag": "$11.21 / piece · NestPaw $34",
        "listing": "OEM/ODM Food-Grade Eco Silicone Slow-Feeder Mat",
        "producer": "Xiamen Hands Chain Silicone Co. Ltd.",
        "badge": "Custom Mfr · 10 yrs",
        "cost": "$11.21",
        "cost_note": "per piece",
        "stats": "4.9/5 (148) · silicone mat (not plastic maze)",
        "url": "https://www.alibaba.com/product-detail/OEM-ODM-Wholesale-Food-Grade-Eco_1601762944691.html",
    },
    {
        "n": "05",
        "name": "Pet Nail Trimmer / Grinder",
        "tag": "$5.69 / piece · NestPaw Quiet Nail Grinder $25",
        "listing": "2-in-1 Pet Nail Trimmer / Grinder (USB · LED)",
        "producer": "Shaanxi Green Bird Supply Chain Co. LTD.",
        "badge": "Multispecialty · 1 yr",
        "cost": "$5.69",
        "cost_note": "per piece",
        "stats": "4.9/5 (17) · MOQ from 1 · QC samples",
        "url": "https://www.alibaba.com/product-detail/2-in-1-Pet-Nail-Trimmer_1601712074583.html",
    },
    {
        "n": "06",
        "name": "Silicone Lick Mat",
        "tag": "$3.50 / piece · used in Calm Evening Bundle (not sold alone)",
        "listing": "Custom Dog Lick Mat Silicone Pet Feeding Mat",
        "producer": "Guangdong Yumingsheng Precision Mfg Co. Ltd.",
        "badge": "Custom Mfr · 2 yrs",
        "cost": "$3.50",
        "cost_note": "per piece",
        "stats": "4,617 sold · 4.7/5 (99) · #1 Pet Bowls",
        "url": "https://www.alibaba.com/product-detail/Custom-Dog-Lick-Mat-Silicone-Pet_1601392779056.html",
    },
]


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="DocTitle",
            fontName="Helvetica-Bold",
            fontSize=20,
            textColor=MOSS,
            leading=24,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Sub",
            fontName="Helvetica",
            fontSize=9.5,
            textColor=MUTED,
            leading=13,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="H",
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=MOSS,
            leading=15,
            spaceBefore=2,
            spaceAfter=3,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Intro",
            fontName="Helvetica",
            fontSize=8.5,
            textColor=MUTED,
            leading=11.5,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Footnote",
            fontName="Helvetica",
            fontSize=7.5,
            textColor=MUTED,
            leading=10,
            spaceBefore=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Th",
            fontName="Helvetica-Bold",
            fontSize=8,
            textColor=white,
            leading=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Td",
            fontName="Helvetica",
            fontSize=8.5,
            textColor=INK,
            leading=11,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TdB",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            textColor=INK,
            leading=11,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TdRight",
            fontName="Helvetica",
            fontSize=8.5,
            textColor=INK,
            leading=11,
            alignment=TA_RIGHT,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Num",
            fontName="Helvetica-Bold",
            fontSize=11,
            textColor=MOSS_SOFT,
            leading=14,
            alignment=TA_CENTER,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CardUse",
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=INK,
            leading=13,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CardTag",
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            leading=10,
            spaceBefore=1,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CardListing",
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=INK,
            leading=12,
            spaceBefore=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CardMeta",
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            leading=11,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CardCost",
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=MOSS,
            leading=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CardCostNote",
            fontName="Helvetica",
            fontSize=7.5,
            textColor=MUTED,
            leading=9.5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CardStats",
            fontName="Helvetica",
            fontSize=8,
            textColor=INK,
            leading=10.5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="OrderLink",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            textColor=ACCENT,
            leading=11,
            alignment=TA_CENTER,
        )
    )
    styles.add(
        ParagraphStyle(
            name="FooterLeft",
            fontName="Helvetica",
            fontSize=7.5,
            textColor=MUTED,
            alignment=TA_LEFT,
        )
    )
    styles.add(
        ParagraphStyle(
            name="FooterRight",
            fontName="Helvetica",
            fontSize=7.5,
            textColor=MUTED,
            alignment=TA_RIGHT,
        )
    )
    return styles


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    y = 0.48 * inch
    canvas.line(0.6 * inch, y, letter[0] - 0.6 * inch, y)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.6 * inch, 0.3 * inch, "NestPaw sourcing catalog")
    canvas.drawRightString(
        letter[0] - 0.6 * inch,
        0.3 * inch,
        f"{date.today().isoformat()}  ·  {doc.page}",
    )
    canvas.restoreState()


def storefront_table(styles):
    header = [
        Paragraph(h, styles["Th"])
        for h in [
            "Product",
            "Sell",
            "Alibaba",
            "To us",
            "Ship→cust",
            "Keep",
            "How to source",
        ]
    ]
    rows = [header]
    for item in STORE:
        keep = contribution(item)
        rows.append(
            [
                Paragraph(item["product"], styles["TdB"]),
                Paragraph(money(item["sell"]).replace(".00", ""), styles["Td"]),
                Paragraph(item["alibaba_label"], styles["Td"]),
                Paragraph(money(item["landed"]), styles["Td"]),
                Paragraph(money(item["outbound"]), styles["Td"]),
                Paragraph(money(keep), styles["TdB"]),
                Paragraph(item["source"], styles["Td"]),
            ]
        )

    # Match full content width (letter − 0.6" × 2), same as order cards
    table = Table(
        rows,
        colWidths=[
            1.85 * inch,
            0.55 * inch,
            0.7 * inch,
            0.65 * inch,
            0.75 * inch,
            0.65 * inch,
            2.15 * inch,
        ],
        hAlign="LEFT",
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), MOSS),
                ("BACKGROUND", (0, 1), (-1, -1), white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, BG]),
                ("LINEBELOW", (0, 0), (-1, 0), 0, MOSS),
                ("LINEBELOW", (0, 1), (-1, -2), 0.4, LINE),
                ("LINEBELOW", (0, -1), (-1, -1), 0.4, LINE),
                ("BOX", (0, 0), (-1, -1), 0.6, RULE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ALIGN", (1, 1), (5, -1), "RIGHT"),
            ]
        )
    )
    return table


def order_card(item, styles):
    """One Alibaba SKU as a readable block — content stays inside the card box."""
    # Full content width inside page margins (letter − 0.6" × 2)
    card_w = 7.3 * inch
    pad = 8  # points — applied only on the outer card
    inner_w = card_w - (2 * pad)

    tag = item["tag"]

    # Title row: number + item name (+ price / usage note under title)
    title_bits = [Paragraph(item["name"], styles["CardUse"])]
    if tag:
        title_bits.append(Paragraph(tag, styles["CardTag"]))

    top = Table(
        [[Paragraph(item["n"], styles["Num"]), title_bits]],
        colWidths=[0.42 * inch, inner_w - 0.42 * inch],
    )
    top.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )

    listing = Paragraph(item["listing"], styles["CardListing"])
    meta = Paragraph(
        f'{item["producer"]}  ·  {item["badge"]}',
        styles["CardMeta"],
    )

    cost_cell = [
        Paragraph(item["cost"], styles["CardCost"]),
        Paragraph(item["cost_note"], styles["CardCostNote"]),
    ]
    stats_cell = Paragraph(item["stats"], styles["CardStats"])
    link_cell = Paragraph(
        f'<link href="{item["url"]}">Order on Alibaba →</link>',
        styles["OrderLink"],
    )

    # Bottom bar: three equal visual cells, all inside the card
    cost_w = 1.4 * inch
    link_w = 1.85 * inch
    stats_w = inner_w - cost_w - link_w
    bottom = Table(
        [[cost_cell, stats_cell, link_cell]],
        colWidths=[cost_w, stats_w, link_w],
    )
    bottom.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BACKGROUND", (0, 0), (-1, 0), BG),
                ("BOX", (0, 0), (-1, 0), 0.5, LINE),
                ("LINEAFTER", (0, 0), (0, 0), 0.5, LINE),
                ("LINEAFTER", (1, 0), (1, 0), 0.5, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    body = Table(
        [[top], [listing], [meta], [Spacer(1, 4)], [bottom]],
        colWidths=[inner_w],
    )
    body.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )

    card = Table([[body]], colWidths=[card_w])
    card.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BG_CARD),
                ("BOX", (0, 0), (-1, -1), 0.7, RULE),
                ("LINEBEFORE", (0, 0), (0, -1), 3.2, MOSS_SOFT),
                ("LEFTPADDING", (0, 0), (-1, -1), pad),
                ("RIGHTPADDING", (0, 0), (-1, -1), pad),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return KeepTogether([card, Spacer(1, 6)])


def main():
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.65 * inch,
    )

    story = []
    story.append(Paragraph("NestPaw — what we sell &amp; where to order", styles["DocTitle"]))
    story.append(
        Paragraph(
            f"U.S. storefront · Alibaba wholesale · Updated {date.today().strftime('%b %d, %Y')}. "
            "Blue links open the Alibaba product page.",
            styles["Sub"],
        )
    )

    story.append(Paragraph("1 · NestPaw storefront", styles["H"]))
    story.append(
        Paragraph(
            "Retail prices, cost to NestPaw, estimated outbound to customer, and what we keep "
            "after Stripe + returns (solo-item orders).",
            styles["Intro"],
        )
    )
    story.append(storefront_table(styles))
    story.append(
        Paragraph(
            "*Calm Evening Alibaba = snuffle $8 + lick $3.50. "
            f"†Brush kit Alibaba = comb {money(COMB_UNIT)} + 1 glove {money(GLOVE_UNIT)} "
            f"(MHC unit = pack of {GLOVE_PACK_QTY} for {money(GLOVE_PACK_COST)} cash → "
            f"{money(GLOVE_UNIT)}/kit). "
            "To us = cost at NestPaw (Alibaba + inbound). "
            "Ship→cust = est. US outbound (self-ship). "
            "Keep = (sell + ship fee) − to us − outbound − Stripe (2.9% + $0.30) − 3% returns. "
            f"Ship fee = $0 if sell ≥ ${FREE_SHIP_AT:.0f}, else ${CUSTOMER_SHIP_FEE:.2f}. "
            "Confirm live Alibaba + carrier quotes before bulk.",
            styles["Footnote"],
        )
    )

    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=0.6, color=LINE, spaceAfter=6))
    story.append(Paragraph("2 · Alibaba order list", styles["H"]))
    story.append(
        Paragraph(
            "One card per Alibaba item to buy — unit price shown on each card. "
            "Shedding Brush Kit needs #01 comb + #02 glove pack. "
            "Calm Evening Bundle needs #03 snuffle + #06 lick mat.",
            styles["Intro"],
        )
    )

    for item in ORDERS:
        story.append(order_card(item, styles))

    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=0.6, color=LINE, spaceAfter=6))
    story.append(
        Paragraph(
            f"Free shipping on NestPaw orders over ${FREE_SHIP_AT:.0f} "
            f"(${CUSTOMER_SHIP_FEE:.2f} under). "
            "Alibaba costs are verified wholesale anchors, not always the public list price. "
            "Outbound estimates are planning figures — replace with real USPS/UPS quotes.",
            styles["Footnote"],
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
