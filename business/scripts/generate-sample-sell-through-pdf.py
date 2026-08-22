#!/usr/bin/env python3
"""Generate NestPaw sample sell-through PDF from the canvas model."""

from datetime import date
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parents[1] / "pdfs" / "nestpaw-sample-sell-through.pdf"

MOSS = HexColor("#1a342c")
ACCENT = HexColor("#2a5c48")
INK = HexColor("#141816")
SOFT = HexColor("#3d4a44")
LINE = HexColor("#dfe5e1")
BG = HexColor("#f5f7f5")
RULE = HexColor("#cdd5d0")

STRIPE_PCT = 0.029
STRIPE_FIXED = 0.30
RETURNS_PCT = 0.03
FREE_AT = 40.0
SHIP_FEE = 5.50
OUTBOUND = 5.50

BRUSH_UNIT = 0.60
GLOVE_UNIT = 0.56
KIT_COGS = BRUSH_UNIT + GLOVE_UNIT
SNUFFLE_COGS = 8.60
FEEDER_COGS = 0.89
GRINDER_COGS = 2.06
LICK_QTY = 19
LICK_COGS = 53.44 / LICK_QTY

KIT_QTY = 10
GLOVE_QTY = 50
LEFTOVER_GLOVES = GLOVE_QTY - KIT_QTY

SKUS = [
    {"product": "Shedding Brush Kit", "qty": KIT_QTY, "sell": 29.0, "cogs": KIT_COGS, "below_moq": False},
    {"product": "Suction Lick Mat", "qty": LICK_QTY, "sell": 14.0, "cogs": LICK_COGS, "below_moq": False},
    {"product": "Quiet Nail Grinder", "qty": 5, "sell": 29.0, "cogs": GRINDER_COGS, "below_moq": False},
    {"product": "Forage Snuffle Mat", "qty": 5, "sell": 44.0, "cogs": SNUFFLE_COGS, "below_moq": True},
    {"product": "Silicone Slow Feeder Mat", "qty": 5, "sell": 29.0, "cogs": FEEDER_COGS, "below_moq": True},
]


def money(n: float) -> str:
    if n < 0:
        return f"-${abs(n):,.2f}"
    return f"${n:,.2f}"


def econ(sell: float, cogs: float, outbound: float = OUTBOUND):
    ship_collected = 0.0 if sell >= FREE_AT else SHIP_FEE
    charged = sell + ship_collected
    stripe = charged * STRIPE_PCT + STRIPE_FIXED
    returns = sell * RETURNS_PCT
    keep = charged - stripe - returns - outbound - cogs
    return {
        "ship_collected": ship_collected,
        "charged": charged,
        "stripe": stripe,
        "returns": returns,
        "keep": keep,
    }


def lines():
    out = []
    for sku in SKUS:
        e = econ(sku["sell"], sku["cogs"])
        qty = sku["qty"]
        out.append(
            {
                **sku,
                **e,
                "product_sales": sku["sell"] * qty,
                "cash_in": e["charged"] * qty,
                "cogs_total": sku["cogs"] * qty,
                "stripe_total": e["stripe"] * qty,
                "outbound_total": OUTBOUND * qty,
                "returns_total": e["returns"] * qty,
                "keep_total": e["keep"] * qty,
            }
        )
    return out


def bulky_keep(outbound: float) -> float:
    total = 0.0
    for sku in SKUS:
        ob = (
            outbound
            if sku["product"] in ("Forage Snuffle Mat", "Silicone Slow Feeder Mat")
            else OUTBOUND
        )
        total += econ(sku["sell"], sku["cogs"], ob)["keep"] * sku["qty"]
    return total


def styles():
    return {
        "title": ParagraphStyle(
            "title", fontName="Helvetica-Bold", fontSize=22, textColor=MOSS, leading=26, spaceAfter=4
        ),
        "lede": ParagraphStyle(
            "lede", fontName="Helvetica", fontSize=10.5, textColor=SOFT, leading=15, spaceAfter=10
        ),
        "section": ParagraphStyle(
            "section",
            fontName="Helvetica-Bold",
            fontSize=11,
            textColor=MOSS,
            leading=13,
            spaceBefore=10,
            spaceAfter=3,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "body", fontName="Helvetica", fontSize=10, textColor=INK, leading=14.5, spaceAfter=4
        ),
        "fine": ParagraphStyle(
            "fine", fontName="Helvetica", fontSize=8.5, textColor=SOFT, leading=12, spaceBefore=3
        ),
        "callout": ParagraphStyle(
            "callout", fontName="Helvetica", fontSize=10, textColor=INK, leading=14.5
        ),
        "label": ParagraphStyle(
            "label",
            fontName="Helvetica-Bold",
            fontSize=7.5,
            textColor=ACCENT,
            leading=9,
            alignment=0,
            spaceAfter=2,
        ),
        "value": ParagraphStyle(
            "value", fontName="Helvetica-Bold", fontSize=12, textColor=INK, leading=15
        ),
        "th": ParagraphStyle(
            "th", fontName="Helvetica-Bold", fontSize=8, textColor=white, leading=10.5
        ),
        "thR": ParagraphStyle(
            "thR",
            fontName="Helvetica-Bold",
            fontSize=8,
            textColor=white,
            leading=10.5,
            alignment=TA_RIGHT,
        ),
        "td": ParagraphStyle(
            "td", fontName="Helvetica", fontSize=8.5, textColor=INK, leading=11.5
        ),
        "tdR": ParagraphStyle(
            "tdR", fontName="Helvetica", fontSize=8.5, textColor=INK, leading=11.5, alignment=TA_RIGHT
        ),
        "tdB": ParagraphStyle(
            "tdB", fontName="Helvetica-Bold", fontSize=8.5, textColor=INK, leading=11.5
        ),
        "tdBR": ParagraphStyle(
            "tdBR",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            textColor=INK,
            leading=11.5,
            alignment=TA_RIGHT,
        ),
    }


def meta_bar(s, sold):
    cells = [
        [Paragraph("PRODUCT SALES", s["label"]), Paragraph(money(sold["product_sales"]), s["value"])],
        [Paragraph("KEEP IF SELL ALL", s["label"]), Paragraph(money(sold["keep"]), s["value"])],
        [Paragraph("UNITS", s["label"]), Paragraph("44 (10 kits + 34 other)", s["value"])],
    ]
    t = Table(
        [[c[0] for c in cells], [c[1] for c in cells]],
        colWidths=[2.27 * inch] * 3,
    )
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BG),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.6, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 1),
                ("TOPPADDING", (0, 1), (-1, 1), 2),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 9),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return t


def table(headers, rows, s, widths, right_from=1, bold_last=False):
    head = []
    for i, h in enumerate(headers):
        head.append(Paragraph(h, s["thR"] if i >= right_from else s["th"]))
    data = [head]
    last = len(rows) - 1
    for r_i, row in enumerate(rows):
        line = []
        strong = bold_last and r_i == last
        for i, cell in enumerate(row):
            if i >= right_from:
                line.append(Paragraph(cell, s["tdBR"] if strong else s["tdR"]))
            else:
                line.append(Paragraph(cell, s["tdB"] if strong else s["td"]))
        data.append(line)
    t = Table(data, colWidths=widths, repeatRows=1)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), MOSS),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            cmds.append(("BACKGROUND", (0, i), (-1, i), BG))
    t.setStyle(TableStyle(cmds))
    return t


def callout(text, s):
    box = Table([[Paragraph(text, s["callout"])]], colWidths=[6.8 * inch])
    box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BG),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("LINEBEFORE", (0, 0), (0, -1), 3.5, ACCENT),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return box


def section_rule():
    return HRFlowable(width="100%", thickness=0.5, color=RULE, spaceBefore=1, spaceAfter=5)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    y = 0.48 * inch
    canvas.line(0.85 * inch, y, letter[0] - 0.85 * inch, y)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(SOFT)
    canvas.drawString(0.85 * inch, 0.28 * inch, "NestPaw  ·  Sample sell-through")
    canvas.drawRightString(
        letter[0] - 0.85 * inch,
        0.28 * inch,
        f"{date.today().strftime('%b %d, %Y')}  ·  {doc.page}",
    )
    canvas.restoreState()


def build():
    s = styles()
    sku_lines = lines()
    sold = {
        "product_sales": sum(l["product_sales"] for l in sku_lines),
        "cash_in": sum(l["cash_in"] for l in sku_lines),
        "cogs": sum(l["cogs_total"] for l in sku_lines),
        "stripe": sum(l["stripe_total"] for l in sku_lines),
        "outbound": sum(l["outbound_total"] for l in sku_lines),
        "returns": sum(l["returns_total"] for l in sku_lines),
        "keep": sum(l["keep_total"] for l in sku_lines),
        "ship_collected": sum(l["ship_collected"] * l["qty"] for l in sku_lines),
    }
    leftover_glove_cash = LEFTOVER_GLOVES * GLOVE_UNIT
    catalog_on_hand = sold["cogs"] + leftover_glove_cash

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.65 * inch,
        title="NestPaw — Sample sell-through",
        author="NestPaw",
    )
    story = []
    story.append(Paragraph("Sell every sample", s["title"]))
    story.append(
        Paragraph(
            "Catalog retail. Product cost is worst-case Alibaba at MOQ (lick mat uses the "
            "$53.44 sample invoice across 19 units on hand). Solo U.S. orders, $5.50 postage. Inbound freight is sunk.",
            s["lede"],
        )
    )
    story.append(meta_bar(s, sold))
    story.append(Spacer(1, 10))
    story.append(
        callout(
            f"<b>Headline.</b> If every sample unit sells at catalog prices, NestPaw takes in "
            f"{money(sold['product_sales'])} and keeps about {money(sold['keep'])} after "
            f"Alibaba COGS, Stripe, $5.50 postage, and a 3% returns pad. Customers also pay "
            f"{money(sold['ship_collected'])} in shipping on the under-$40 items.",
            s,
        )
    )

    story.append(Paragraph("Contribution by SKU if all units sell", s["section"]))
    story.append(section_rule())
    story.append(
        table(
            ["Product", "Qty", "Sell", "Unit COGS", "Keep / sale", "Product sales", "If sell all"],
            [
                [
                    f"{l['product']} (below MOQ)" if l["below_moq"] else l["product"],
                    str(l["qty"]),
                    money(l["sell"]),
                    money(l["cogs"]),
                    money(l["keep"]),
                    money(l["product_sales"]),
                    money(l["keep_total"]),
                ]
                for l in sku_lines
            ],
            s,
            [1.85 * inch, 0.45 * inch, 0.7 * inch, 0.85 * inch, 0.9 * inch, 1.05 * inch, 1.0 * inch],
        )
    )
    story.append(
        Paragraph(
            "Keep after catalog Alibaba, Stripe 2.9%+$0.30, $5.50 outbound, 3% returns. "
            "Source: NestPaw catalog · sample quantities · Aug 2026.",
            s["fine"],
        )
    )

    story.append(Paragraph("Cash in vs cash out", s["section"]))
    story.append(section_rule())
    story.append(
        table(
            ["Line", "Amount"],
            [
                ["Product sales", money(sold["product_sales"])],
                ["Shipping collected", money(sold["ship_collected"])],
                ["Customers pay", money(sold["cash_in"])],
                ["Product COGS (units sold)", money(sold["cogs"])],
                ["Outbound postage", money(sold["outbound"])],
                ["Stripe fees", money(sold["stripe"])],
                ["Returns pad (3%)", money(sold["returns"])],
                ["Left over", money(sold["keep"])],
            ],
            s,
            [4.8 * inch, 2.0 * inch],
            right_from=1,
            bold_last=True,
        )
    )

    story.append(Paragraph("Two lots are below listing MOQ", s["section"]))
    story.append(section_rule())
    story.append(
        Paragraph(
            "Five snuffle mats are below the 90-pc $8.60 band. Five slow feeders are below "
            "the 20-pc $0.89 band. If the supplier charged a sample premium, keep on those "
            "10 units shrinks. Brush (10), gloves (50), and grinders (5) sit inside their "
            "listing tiers.",
            s["body"],
        )
    )

    story.append(Paragraph("What this does not include", s["section"]))
    story.append(section_rule())
    story.append(
        table(
            ["Item", "Amount", "Why"],
            [
                [
                    "Leftover grooming gloves",
                    f"{LEFTOVER_GLOVES} pcs · {money(leftover_glove_cash)} at cost",
                    "Only 10 kits until more brushes.",
                ],
                [
                    "Catalog product cost on hand",
                    money(catalog_on_hand),
                    "Sold units plus leftover gloves, at listing COGS. Not DDP invoices.",
                ],
                [
                    "Ads, Higgsfield, printer, labels",
                    "Not in this P&amp;L",
                    "Ops spend does not change if these 44 orders happen.",
                ],
                [
                    "Bulky postage",
                    f"{money(bulky_keep(7))} keep at $7 · {money(bulky_keep(12))} at $12",
                    "If snuffle and feeder labels run $7–$12 instead of $5.50.",
                ],
            ],
            s,
            [1.9 * inch, 2.2 * inch, 2.7 * inch],
            right_from=99,
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
