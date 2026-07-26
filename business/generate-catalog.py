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

OUT = Path(__file__).with_name("nestpaw-product-catalog.pdf")

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

STORE = [
    ("Shedding Brush Kit", "$24", "$7.00", "$10.00", "$12.28", "Kinghon comb + MHC glove"),
    ("Forage Snuffle Mat", "$28", "$8.00", "$14.00", "$12.05", "Snuffle listing"),
    ("Silicone Slow Feeder Mat", "$33", "$11.21", "$18.00", "$12.75", "Slow-feeder listing"),
    ("Quiet Nail Grinder", "$25", "$5.69", "$11.00", "$12.22", "Nail-grinder listing"),
    ("Calm Evening Bundle", "$35", "$12.00*", "$20.00", "$12.63", "Snuffle + lick (2 orders)"),
]

# One row per Alibaba SKU to buy
ORDERS = [
    {
        "n": "01",
        "use": "Shedding Brush Kit",
        "sell": "$24",
        "tag": "Part 1 of 2",
        "listing": "Dog and Cat One-button Hair Remove Comb",
        "producer": "Yiwu Kinghon Pet Products Co. Ltd.",
        "badge": "Verified · 8 yrs",
        "cost": "$7.00",
        "cost_note": "kit total (comb + glove)",
        "stats": "1,840 sold · 4.8/5 (573) · #11 Pet Cleaning",
        "url": "https://www.alibaba.com/product-detail/Dog-and-Cat-One-button-Hair_1601126914170.html",
    },
    {
        "n": "02",
        "use": "Shedding Brush Kit",
        "sell": "$24",
        "tag": "Part 2 of 2",
        "listing": "MHC Customizable Size Silicone Grooming Gloves",
        "producer": "MHC",
        "badge": "Kit component",
        "cost": "—",
        "cost_note": "included in kit $7",
        "stats": "Order together with the Kinghon comb",
        "url": "https://www.alibaba.com/product-detail/MHC-Customizable-Size-Silicone-Grooming-Gloves_1601358986188.html",
    },
    {
        "n": "03",
        "use": "Forage Snuffle Mat",
        "sell": "$28",
        "tag": "Also in Calm Evening",
        "listing": "LS OEM Waterproof Interactive Dog Foraging Mat",
        "producer": "Weihai L.S. / PEPPY BUDDIES",
        "badge": "Custom Mfr · 5 yrs",
        "cost": "$8.00",
        "cost_note": "wholesale anchor",
        "stats": "5.0/5 (128) · MOQ ~90–180",
        "url": "https://www.alibaba.com/product-detail/LS-OEM-Waterproof-Interactive-Dog-Foraging_1600772908467.html",
    },
    {
        "n": "04",
        "use": "Silicone Slow Feeder Mat",
        "sell": "$33",
        "tag": "",
        "listing": "OEM/ODM Food-Grade Eco Silicone Slow-Feeder Mat",
        "producer": "Xiamen Hands Chain Silicone Co. Ltd.",
        "badge": "Custom Mfr · 10 yrs",
        "cost": "$11.21",
        "cost_note": "wholesale anchor",
        "stats": "4.9/5 (148) · silicone mat (not plastic maze)",
        "url": "https://www.alibaba.com/product-detail/OEM-ODM-Wholesale-Food-Grade-Eco_1601762944691.html",
    },
    {
        "n": "05",
        "use": "Quiet Nail Grinder",
        "sell": "$25",
        "tag": "",
        "listing": "2-in-1 Pet Nail Trimmer / Grinder (USB · LED)",
        "producer": "Shaanxi Green Bird Supply Chain Co. LTD.",
        "badge": "Multispecialty · 1 yr",
        "cost": "$5.69",
        "cost_note": "wholesale anchor",
        "stats": "4.9/5 (17) · MOQ from 1 · QC samples",
        "url": "https://www.alibaba.com/product-detail/2-in-1-Pet-Nail-Trimmer_1601712074583.html",
    },
    {
        "n": "06",
        "use": "Calm Evening Bundle",
        "sell": "$35",
        "tag": "Lick mat only · not sold alone",
        "listing": "Custom Dog Lick Mat Silicone Pet Feeding Mat",
        "producer": "Guangdong Yumingsheng Precision Mfg Co. Ltd.",
        "badge": "Custom Mfr · 2 yrs",
        "cost": "$3.50",
        "cost_note": "bundle component",
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
        for h in ["Product", "Sell", "Alibaba", "Landed", "Contrib.", "How to source"]
    ]
    rows = [header]
    for product, sell, cost, landed, contrib, source in STORE:
        rows.append(
            [
                Paragraph(product, styles["TdB"]),
                Paragraph(sell, styles["Td"]),
                Paragraph(cost, styles["Td"]),
                Paragraph(landed, styles["Td"]),
                Paragraph(contrib, styles["Td"]),
                Paragraph(source, styles["Td"]),
            ]
        )

    # Match full content width (letter − 0.6" × 2), same as order cards
    table = Table(
        rows,
        colWidths=[
            2.15 * inch,
            0.65 * inch,
            0.8 * inch,
            0.75 * inch,
            0.8 * inch,
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
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ALIGN", (1, 1), (4, -1), "RIGHT"),
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

    use_line = f'{item["use"]}  ·  {item["sell"]}'
    tag = item["tag"]

    # Title row: number + product (+ optional tag badge under title)
    title_bits = [Paragraph(use_line, styles["CardUse"])]
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
            "Retail prices, estimated landed cost, and contribution after Stripe + returns reserve.",
            styles["Intro"],
        )
    )
    story.append(storefront_table(styles))
    story.append(
        Paragraph(
            "*Calm Evening cost = snuffle $8 + lick $3.50. Landed includes outbound ship. "
            "Contrib. = sell − landed − Stripe (2.9% + $0.30) − 3% returns. "
            "Confirm live Alibaba quotes before bulk.",
            styles["Footnote"],
        )
    )

    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=0.6, color=LINE, spaceAfter=6))
    story.append(Paragraph("2 · Alibaba order list", styles["H"]))
    story.append(
        Paragraph(
            "One card per Alibaba SKU to buy. Brush kit = two orders. "
            "Calm Evening = snuffle (#03) + lick (#06) — no bundle SKU on Alibaba.",
            styles["Intro"],
        )
    )

    for item in ORDERS:
        story.append(order_card(item, styles))

    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=0.6, color=LINE, spaceAfter=6))
    story.append(
        Paragraph(
            "Free shipping on NestPaw orders over $30 ($4.95 under). "
            "Alibaba costs are verified wholesale anchors, not always the public list price.",
            styles["Footnote"],
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
