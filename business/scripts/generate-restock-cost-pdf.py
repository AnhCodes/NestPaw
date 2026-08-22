#!/usr/bin/env python3
"""Generate NestPaw restock cost + sell-out PDF from the canvas model."""

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

OUT = Path(__file__).resolve().parents[1] / "pdfs" / "nestpaw-restock-cost.pdf"

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
INBOUND = 6.00  # catalog mid pad; DDP quotes replace this

BRUSH_UNIT = 0.60
GLOVE_UNIT = 0.56
KIT_COGS = BRUSH_UNIT + GLOVE_UNIT
SNUFFLE_COGS = 8.60
FEEDER_COGS = 0.89
GRINDER_COGS = 2.06
LICK_COGS = 53.44 / 10

STORE_SKUS = [
    {"key": "kit", "product": "Shedding Brush Kit", "sell": 29.0, "cogs": KIT_COGS},
    {"key": "snuffle", "product": "Forage Snuffle Mat", "sell": 44.0, "cogs": SNUFFLE_COGS},
    {"key": "feeder", "product": "Silicone Slow Feeder Mat", "sell": 29.0, "cogs": FEEDER_COGS},
    {"key": "grinder", "product": "Quiet Nail Grinder", "sell": 29.0, "cogs": GRINDER_COGS},
    {"key": "lick", "product": "Suction Lick Mat", "sell": 14.0, "cogs": LICK_COGS, "lick": True},
]

BUY_60 = [
    ("Deshedding brush", 60, BRUSH_UNIT),
    ("Grooming glove", 60, GLOVE_UNIT),
    ("Forage Snuffle Mat", 60, SNUFFLE_COGS),
    ("Silicone Slow Feeder Mat", 60, FEEDER_COGS),
    ("Quiet Nail Grinder", 60, GRINDER_COGS),
    ("Suction Lick Mat *", 60, LICK_COGS),
]

BUY_MOQ = [
    ("Deshedding brush", 50, BRUSH_UNIT),
    ("Grooming glove", 50, GLOVE_UNIT),
    ("Forage Snuffle Mat", 90, SNUFFLE_COGS),
    ("Silicone Slow Feeder Mat", 20, FEEDER_COGS),
    ("Quiet Nail Grinder", 50, GRINDER_COGS),
    ("Suction Lick Mat", 50, LICK_COGS),
]

QTY_60 = {"kit": 60, "snuffle": 60, "feeder": 60, "grinder": 60, "lick": 60}
QTY_MOQ = {"kit": 50, "snuffle": 90, "feeder": 20, "grinder": 50, "lick": 50}


def money(n: float) -> str:
    if n < 0:
        return f"-${abs(n):,.2f}"
    return f"${n:,.2f}"


def cents(n: float) -> float:
    return round(n * 100) / 100


def econ(sell: float, cogs: float, inbound: float):
    ship_collected = 0.0 if sell >= FREE_AT else SHIP_FEE
    charged = sell + ship_collected
    stripe = charged * STRIPE_PCT + STRIPE_FIXED
    returns = sell * RETURNS_PCT
    keep = charged - stripe - returns - OUTBOUND - cogs - inbound
    return {
        "ship_collected": ship_collected,
        "charged": charged,
        "stripe": stripe,
        "returns": returns,
        "keep": keep,
    }


def buy_total(rows):
    return cents(sum(unit * qty for _, qty, unit in rows))


def scenario(qty: dict, inbound: float):
    lines = []
    for sku in STORE_SKUS:
        n = qty[sku["key"]]
        e = econ(sku["sell"], sku["cogs"], inbound)
        lines.append(
            {
                **sku,
                "qty": n,
                **e,
                "product_cost": cents(sku["cogs"] * n),
                "inbound_total": cents(inbound * n),
                "landed": cents(sku["cogs"] * n + inbound * n),
                "product_sales": cents(sku["sell"] * n),
                "cash_in": cents(e["charged"] * n),
                "keep_total": cents(e["keep"] * n),
                "stripe_total": cents(e["stripe"] * n),
                "outbound_total": cents(OUTBOUND * n),
                "returns_total": cents(e["returns"] * n),
                "ship_collected_total": cents(e["ship_collected"] * n),
            }
        )
    sold = {
        "units": sum(l["qty"] for l in lines),
        "product_cost": cents(sum(l["product_cost"] for l in lines)),
        "inbound": cents(sum(l["inbound_total"] for l in lines)),
        "landed": cents(sum(l["landed"] for l in lines)),
        "product_sales": cents(sum(l["product_sales"] for l in lines)),
        "cash_in": cents(sum(l["cash_in"] for l in lines)),
        "keep": cents(sum(l["keep_total"] for l in lines)),
        "stripe": cents(sum(l["stripe_total"] for l in lines)),
        "outbound": cents(sum(l["outbound_total"] for l in lines)),
        "returns": cents(sum(l["returns_total"] for l in lines)),
        "ship_collected": cents(sum(l["ship_collected_total"] for l in lines)),
    }
    return lines, sold


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
            "label", fontName="Helvetica-Bold", fontSize=7.5, textColor=ACCENT, leading=9, spaceAfter=2
        ),
        "value": ParagraphStyle(
            "value", fontName="Helvetica-Bold", fontSize=11.5, textColor=INK, leading=14
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


def meta_bar(s, rows):
    t = Table(
        [
            [Paragraph(label, s["label"]) for label, _ in rows],
            [Paragraph(value, s["value"]) for _, value in rows],
        ],
        colWidths=[2.27 * inch] * len(rows),
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
    head = [Paragraph(h, s["thR"] if i >= right_from else s["th"]) for i, h in enumerate(headers)]
    data = [head]
    last = len(rows) - 1
    for r_i, row in enumerate(rows):
        strong = bold_last and r_i == last
        line = []
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
    canvas.drawString(0.85 * inch, 0.28 * inch, "NestPaw  ·  Restock cost and sell-out")
    canvas.drawRightString(
        letter[0] - 0.85 * inch,
        0.28 * inch,
        f"{date.today().strftime('%b %d, %Y')}  ·  {doc.page}",
    )
    canvas.restoreState()


def build():
    s = styles()
    lines_60, sold_60 = scenario(QTY_60, INBOUND)
    lines_moq, sold_moq = scenario(QTY_MOQ, INBOUND)
    product_60 = buy_total(BUY_60)
    product_moq = buy_total(BUY_MOQ)

    sensitivity = []
    for pad in (0.0, 3.0, 6.0, 12.0):
        _, sold = scenario(QTY_60, pad)
        _, moq = scenario(QTY_MOQ, pad)
        sensitivity.append(
            [
                money(pad),
                money(sold["landed"]),
                money(sold["keep"]),
                money(moq["landed"]),
                money(moq["keep"]),
            ]
        )

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.65 * inch,
        title="NestPaw — Restock cost and sell-out",
        author="NestPaw",
    )
    story = []
    story.append(Paragraph("Restock cost and sell-out", s["title"]))
    story.append(
        Paragraph(
            "Catalog Alibaba listing prices. Same Stripe, postage, and returns model as the "
            "sample sell-through. Inbound freight shown at the catalog mid pad of $6/sellable "
            "unit until DDP quotes replace it.",
            s["lede"],
        )
    )
    story.append(
        meta_bar(
            s,
            [
                ("ALIBABA · 60 OF EACH", money(product_60)),
                ("LANDED @ $6 INBOUND", money(sold_60["landed"])),
                ("KEEP IF 60-QTY SELLS OUT", money(sold_60["keep"])),
            ],
        )
    )
    story.append(Spacer(1, 10))
    story.append(
        callout(
            f"<b>Headline.</b> Buying 60 of every item is {money(product_60)} of product "
            f"({money(sold_60['landed'])} landed at $6 inbound per sellable unit). If that "
            f"lot sells out at catalog retail, NestPaw keeps about {money(sold_60['keep'])} "
            f"after Alibaba, inbound pad, Stripe, $5.50 postage, and a 3% returns pad. "
            f"Product sales would be {money(sold_60['product_sales'])} across 300 units.",
            s,
        )
    )

    story.append(Paragraph("Cost to buy 60 of each item", s["section"]))
    story.append(section_rule())
    buy_rows = [
        [name, str(qty), money(unit), money(cents(unit * qty))] for name, qty, unit in BUY_60
    ]
    buy_rows.append(["Alibaba product total", "300 sellable", "", money(product_60)])
    buy_rows.append(["Inbound pad @ $6 / sellable", "300", money(INBOUND), money(sold_60["inbound"])])
    buy_rows.append(["Landed total", "", "", money(sold_60["landed"])])
    story.append(
        table(
            ["Item", "Qty", "Unit $", "Product total"],
            buy_rows,
            s,
            [3.0 * inch, 1.2 * inch, 1.2 * inch, 1.4 * inch],
            bold_last=True,
        )
    )
    story.append(
        Paragraph(
            "* Lick mat uses $53.44 / 10 from the sample invoice. Brush + glove = 60 kits. "
            "Source: NestPaw catalog listing bands · Aug 2026.",
            s["fine"],
        )
    )

    story.append(Paragraph("If 60 of each sells out", s["section"]))
    story.append(section_rule())
    story.append(
        table(
            ["Product", "Qty", "Sell", "Unit COGS", "Keep / sale", "Product sales", "If sell all"],
            [
                [
                    f"{l['product']} (sample unit $)" if l.get("lick") else l["product"],
                    str(l["qty"]),
                    money(l["sell"]),
                    money(l["cogs"]),
                    money(cents(l["keep"])),
                    money(l["product_sales"]),
                    money(l["keep_total"]),
                ]
                for l in lines_60
            ],
            s,
            [1.85 * inch, 0.45 * inch, 0.7 * inch, 0.85 * inch, 0.9 * inch, 1.05 * inch, 1.0 * inch],
        )
    )

    story.append(Paragraph("Cash in vs cash out · 60-qty sell-out", s["section"]))
    story.append(section_rule())
    story.append(
        table(
            ["Line", "Amount"],
            [
                ["Product sales", money(sold_60["product_sales"])],
                ["Shipping collected", money(sold_60["ship_collected"])],
                ["Customers pay", money(sold_60["cash_in"])],
                ["Product COGS", money(sold_60["product_cost"])],
                ["Inbound pad @ $6", money(sold_60["inbound"])],
                ["Outbound postage", money(sold_60["outbound"])],
                ["Stripe fees", money(sold_60["stripe"])],
                ["Returns pad (3%)", money(sold_60["returns"])],
                ["Left over", money(sold_60["keep"])],
            ],
            s,
            [4.8 * inch, 2.0 * inch],
            bold_last=True,
        )
    )

    story.append(Paragraph("Planned full restock (supplier MOQ mix)", s["section"]))
    story.append(section_rule())
    story.append(
        Paragraph(
            "Quantities from the restock quote sheet: 50 kits, 90 snuffle, 20 feeder, "
            "50 grinder, 50 lick. Grinder listing MOQ is 1; 50 is the restock ask.",
            s["body"],
        )
    )
    story.append(
        meta_bar(
            s,
            [
                ("ALIBABA · MOQ MIX", money(product_moq)),
                ("LANDED MOQ RESTOCK", money(sold_moq["landed"])),
                ("KEEP IF MOQ SELLS OUT", money(sold_moq["keep"])),
            ],
        )
    )
    story.append(Spacer(1, 8))
    moq_buy = [[name, str(qty), money(unit), money(cents(unit * qty))] for name, qty, unit in BUY_MOQ]
    moq_buy.append(["Alibaba product total", "260 sellable", "", money(product_moq)])
    moq_buy.append(["Inbound pad @ $6 / sellable", "260", money(INBOUND), money(sold_moq["inbound"])])
    moq_buy.append(["Landed total", "", "", money(sold_moq["landed"])])
    story.append(
        table(
            ["Item", "Qty", "Unit $", "Product total"],
            moq_buy,
            s,
            [3.0 * inch, 1.2 * inch, 1.2 * inch, 1.4 * inch],
            bold_last=True,
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        table(
            ["Product", "Qty", "Product sales", "Keep if sell all"],
            [
                [l["product"], str(l["qty"]), money(l["product_sales"]), money(l["keep_total"])]
                for l in lines_moq
            ],
            s,
            [2.8 * inch, 0.8 * inch, 1.6 * inch, 1.6 * inch],
        )
    )
    story.append(
        Paragraph(
            f"MOQ mix sell-out: {money(sold_moq['product_sales'])} product sales, "
            f"{money(sold_moq['keep'])} keep. Source: business/SUPPLIER-QUOTE.md · catalog listing.",
            s["fine"],
        )
    )

    story.append(Paragraph("Inbound freight sensitivity", s["section"]))
    story.append(section_rule())
    story.append(
        table(
            ["Inbound / unit", "60-qty landed", "60-qty keep", "MOQ landed", "MOQ keep"],
            sensitivity,
            s,
            [1.36 * inch] * 5,
            right_from=0,
        )
    )

    story.append(Paragraph("What this does not include", s["section"]))
    story.append(section_rule())
    story.append(
        Paragraph(
            "DDP door quotes will replace the inbound pad. Ads, Higgsfield, tips cards, and "
            "packing supplies are not in this P&amp;L. Snuffle and feeder postage may run "
            "$7–$12 instead of $5.50. Lick mat listing price is still unknown — if bulk is "
            "cheaper than $5.34, keep on that SKU improves.",
            s["body"],
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
