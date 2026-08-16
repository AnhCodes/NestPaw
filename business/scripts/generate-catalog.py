#!/usr/bin/env python3
"""Generate NestPaw product catalog PDF with clean typography."""

from datetime import date
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parents[1] / "pdfs" / "nestpaw-product-catalog.pdf"

# Palette (shared with investor brief / pipeline)
MOSS = HexColor("#1f3d32")
INK = HexColor("#111111")
MUTED = HexColor("#4a5750")
LINE = HexColor("#d5ddd7")
BG = HexColor("#f4f7f5")  # sub-product / component rows
RULE = HexColor("#c5cec8")
PRODUCT_BG = white  # top-level products

# Free ship on NestPaw orders ≥ $40; customer pays $5.50 under.
FREE_SHIP_AT = 40.0
CUSTOMER_SHIP_FEE = 5.5
STRIPE_PCT = 0.029
STRIPE_FIXED = 0.30
RETURNS_PCT = 0.03

# Freight planning pads (per unit). To us / Ship / Keep show light → heavy.
TO_US_LOW, TO_US_MED, TO_US_HIGH = 3.0, 6.0, 12.0
SHIP_LOW, SHIP_MED, SHIP_HIGH = 5.0, 7.0, 12.0
RANGE_JOIN = "\u2011"
TO_US_RANGE = f"${TO_US_LOW:.2f}{RANGE_JOIN}${TO_US_HIGH:.2f}"
SHIP_RANGE = f"${SHIP_LOW:.2f}{RANGE_JOIN}${SHIP_HIGH:.2f}"

# Brush listing $0.45–$0.60 · MOQ 10 → use $0.60
# Gloves listing $0.56 · 50–99 pcs
# Sold together as Shedding Brush Kit
COMB_UNIT = 0.60
COMB_MOQ = 10  # supplier MOQ; kit restock is 50 to match gloves
GLOVE_UNIT = 0.56
GLOVE_MOQ = 50
GLOVE_MOQ_PRICE = round(GLOVE_UNIT * GLOVE_MOQ, 2)  # $28.00
KIT_SELL = 29.0
KIT_ALIBABA = round(COMB_UNIT + GLOVE_UNIT, 2)  # $1.16
KIT_MOQ = 50
KIT_MOQ_PRICE = round(COMB_UNIT * KIT_MOQ + GLOVE_UNIT * GLOVE_MOQ, 2)  # $58.00

# Snuffle listing $8.60/pc · 90–999 pcs
SNUFFLE_UNIT = 8.60
SNUFFLE_MOQ = 90
SNUFFLE_MOQ_PRICE = round(SNUFFLE_UNIT * SNUFFLE_MOQ, 2)  # $774.00
SNUFFLE_SELL = 44.0

# Slow feeder listing $0.54–$0.89/pc · MOQ 20 → use $0.89
SLOW_FEEDER_UNIT = 0.89
SLOW_FEEDER_MOQ = 20
SLOW_FEEDER_MOQ_PRICE = round(SLOW_FEEDER_UNIT * SLOW_FEEDER_MOQ, 2)  # $17.80
SLOW_FEEDER_SELL = 29.0

# Nail grinder listing $2.06/pc · 1–199 pcs
NAIL_UNIT = 2.06
NAIL_MOQ = 1
NAIL_MOQ_PRICE = round(NAIL_UNIT * NAIL_MOQ, 2)
NAIL_SELL = 29.0


def money(n: float) -> str:
    """Always two decimals so numeric columns share the same width shape."""
    if abs(n) >= 1000:
        return f"${n:,.2f}"
    if n < 0:
        return f"-${abs(n):.2f}"
    return f"${n:.2f}"


def money_plain(n: float) -> str:
    """Non-negative money; used in fixed-width range ends."""
    n = max(0.0, n)
    if n >= 1000:
        return f"${n:,.2f}"
    return f"${n:.2f}"


def nobr(text: str) -> str:
    """Keep a money string / range on a single visual line."""
    glued = text.replace(" ", "\u00a0")
    return f"<nobr>{glued}</nobr>"


def keep_contribution(
    sell: float,
    alibaba: float,
    to_us: float = TO_US_MED,
    ship: float = SHIP_MED,
) -> float:
    """Keep after Alibaba, freight pads, Stripe, and returns."""
    ship_collected = 0.0 if sell >= FREE_SHIP_AT else CUSTOMER_SHIP_FEE
    charged = sell + ship_collected
    stripe = charged * STRIPE_PCT + STRIPE_FIXED
    returns = sell * RETURNS_PCT
    return charged - alibaba - to_us - ship - stripe - returns


def keep_range(sell: float, alibaba: float) -> str:
    """Keep under light vs heavy freight; floor at $0."""
    k_light = keep_contribution(sell, alibaba, TO_US_LOW, SHIP_LOW)
    k_heavy = keep_contribution(sell, alibaba, TO_US_HIGH, SHIP_HIGH)
    lo = max(0.0, min(k_heavy, k_light))
    hi = max(0.0, max(k_heavy, k_light))
    return f"{money_plain(lo)}{RANGE_JOIN}{money_plain(hi)}"


STORE = [
    {
        "product": "Shedding Brush Kit",
        "sell": KIT_SELL,
        "alibaba": KIT_ALIBABA,
        "moq_label": str(KIT_MOQ),
        "moq_price": KIT_MOQ_PRICE,
        "role": "kit",
    },
    {
        "product": "Deshedding brush",
        "sell": None,
        "alibaba": COMB_UNIT,
        "moq_label": str(COMB_MOQ),
        "moq_price": round(COMB_UNIT * COMB_MOQ, 2),
        "role": "component",
    },
    {
        "product": "Grooming glove",
        "sell": None,
        "alibaba": GLOVE_UNIT,
        "moq_label": str(GLOVE_MOQ),
        "moq_price": GLOVE_MOQ_PRICE,
        "role": "component",
    },
    {
        "product": "Forage Snuffle Mat",
        "sell": SNUFFLE_SELL,
        "alibaba": SNUFFLE_UNIT,
        "moq_label": str(SNUFFLE_MOQ),
        "moq_price": SNUFFLE_MOQ_PRICE,
    },
    {
        "product": "Silicone Slow Feeder Mat",
        "sell": SLOW_FEEDER_SELL,
        "alibaba": SLOW_FEEDER_UNIT,
        "moq_label": str(SLOW_FEEDER_MOQ),
        "moq_price": SLOW_FEEDER_MOQ_PRICE,
    },
    {
        "product": "Quiet Nail Grinder",
        "sell": NAIL_SELL,
        "alibaba": NAIL_UNIT,
        "moq_label": str(NAIL_MOQ),
        "moq_price": NAIL_MOQ_PRICE,
    },
]


def build_styles():
    return {
        "title": ParagraphStyle(
            "DocTitle",
            fontName="Helvetica-Bold",
            fontSize=22,
            textColor=MOSS,
            leading=26,
            spaceAfter=4,
        ),
        "lede": ParagraphStyle(
            "Lede",
            fontName="Helvetica",
            fontSize=10.5,
            textColor=MUTED,
            leading=14.5,
            spaceAfter=4,
        ),
        "intro": ParagraphStyle(
            "Intro",
            fontName="Helvetica",
            fontSize=9.5,
            textColor=MUTED,
            leading=13.5,
            spaceAfter=14,
        ),
        "tdB": ParagraphStyle(
            "TdB",
            fontName="Helvetica-Bold",
            fontSize=8,
            textColor=INK,
            leading=10,
        ),
        "tdComponent": ParagraphStyle(
            "TdComponent",
            fontName="Helvetica",
            fontSize=7.5,
            textColor=MUTED,
            leading=9.5,
            leftIndent=6,
        ),
        "num": ParagraphStyle(
            "Num",
            fontName="Courier",
            fontSize=8,
            textColor=INK,
            leading=10,
            alignment=TA_RIGHT,
        ),
        "numB": ParagraphStyle(
            "NumB",
            fontName="Courier-Bold",
            fontSize=8,
            textColor=INK,
            leading=10,
            alignment=TA_RIGHT,
        ),
        "numMute": ParagraphStyle(
            "NumMute",
            fontName="Courier",
            fontSize=8,
            textColor=MUTED,
            leading=10,
            alignment=TA_RIGHT,
        ),
        "range": ParagraphStyle(
            "Range",
            fontName="Courier",
            fontSize=7.5,
            textColor=MUTED,
            leading=9.5,
            alignment=TA_RIGHT,
        ),
        "rangeB": ParagraphStyle(
            "RangeB",
            fontName="Courier-Bold",
            fontSize=7.5,
            textColor=INK,
            leading=9.5,
            alignment=TA_RIGHT,
        ),
        "th": ParagraphStyle(
            "Th",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            textColor=white,
            leading=10.5,
        ),
        "thRight": ParagraphStyle(
            "ThRight",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            textColor=white,
            leading=10.5,
            alignment=TA_RIGHT,
        ),
        "section": ParagraphStyle(
            "Section",
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=MOSS,
            leading=15,
            spaceBefore=4,
            spaceAfter=4,
        ),
        "chartIntro": ParagraphStyle(
            "ChartIntro",
            fontName="Helvetica",
            fontSize=9,
            textColor=MUTED,
            leading=12.5,
            spaceAfter=10,
        ),
        "legend": ParagraphStyle(
            "Legend",
            fontName="Helvetica",
            fontSize=8.5,
            textColor=MUTED,
            leading=11,
            spaceBefore=6,
        ),
    }


MARGIN_X = 0.3 * inch


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    y = 0.48 * inch
    canvas.line(MARGIN_X, y, letter[0] - MARGIN_X, y)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, 0.28 * inch, "NestPaw · Product catalog")
    canvas.drawRightString(
        letter[0] - MARGIN_X,
        0.28 * inch,
        f"{date.today().strftime('%b %d, %Y')}  ·  {doc.page}",
    )
    canvas.restoreState()


def blank_cell(styles):
    return Paragraph("—", styles["numMute"])


def money_cell(amount: float, styles, bold: bool = False) -> Paragraph:
    style = styles["numB"] if bold else styles["num"]
    return Paragraph(nobr(money(amount)), style)


def storefront_table(styles):
    # nobr + nbsp so headers never split ("To us", "MOQ $").
    headers = [
        ("Product", "th"),
        ("Sell", "thRight"),
        ("Alibaba", "thRight"),
        ("MOQ", "thRight"),
        ("MOQ\u00a0$", "thRight"),
        ("To\u00a0us", "thRight"),
        ("Ship", "thRight"),
        ("Keep", "thRight"),
    ]
    rows = [
        [Paragraph(nobr(label), styles[style]) for label, style in headers]
    ]
    row_bgs = []

    for item in STORE:
        alibaba = item["alibaba"]
        alibaba_label = item.get("alibaba_label") or money(alibaba)
        role = item.get("role")
        row_bgs.append(BG if role == "component" else PRODUCT_BG)

        # Product names: non-breaking spaces so multi-word names stay one line
        name = item["product"].replace(" ", "\u00a0")
        if role == "component":
            product_cell = Paragraph(nobr(f"· {name}"), styles["tdComponent"])
        else:
            product_cell = Paragraph(nobr(name), styles["tdB"])

        if item.get("sell") is None:
            sell_cell = blank_cell(styles)
            keep_cell = blank_cell(styles)
            to_us_cell = blank_cell(styles)
            ship_cell = blank_cell(styles)
        else:
            sell = item["sell"]
            sell_cell = money_cell(sell, styles)
            keep_cell = Paragraph(nobr(keep_range(sell, alibaba)), styles["rangeB"])
            to_us_cell = Paragraph(nobr(TO_US_RANGE), styles["range"])
            ship_cell = Paragraph(nobr(SHIP_RANGE), styles["range"])

        rows.append(
            [
                product_cell,
                sell_cell,
                Paragraph(nobr(alibaba_label), styles["num"]),
                Paragraph(nobr(item["moq_label"]), styles["num"]),
                money_cell(item["moq_price"], styles),
                to_us_cell,
                ship_cell,
                keep_cell,
            ]
        )

    # letter − 0.3" × 2 = 7.9" — sized so every cell fits one line (padding-aware)
    table = Table(
        rows,
        colWidths=[
            1.62 * inch,  # Product
            0.62 * inch,  # Sell
            0.70 * inch,  # Alibaba
            0.45 * inch,  # MOQ
            0.70 * inch,  # MOQ $
            1.07 * inch,  # To us
            1.07 * inch,  # Ship
            1.07 * inch,  # Keep
        ],
        hAlign="LEFT",
    )
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), MOSS),
        ("LINEBELOW", (0, 1), (-1, -2), 0.4, LINE),
        ("LINEBELOW", (0, -1), (-1, -1), 0.4, LINE),
        ("BOX", (0, 0), (-1, -1), 0.5, RULE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, -1), 5),
        ("RIGHTPADDING", (0, 0), (0, -1), 3),
        ("LEFTPADDING", (1, 0), (-1, -1), 2),
        ("RIGHTPADDING", (1, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
    ]
    for i, bg in enumerate(row_bgs):
        r = i + 1
        style_cmds.append(("BACKGROUND", (0, r), (-1, r), bg))
    table.setStyle(TableStyle(style_cmds))
    return table


def main():
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=0.55 * inch,
        bottomMargin=0.65 * inch,
    )

    story = []
    story.append(Paragraph("NestPaw product catalog", styles["title"]))
    story.append(
        Paragraph(
            f"U.S. storefront · Alibaba wholesale · {date.today().strftime('%B %d, %Y')}",
            styles["lede"],
        )
    )
    story.append(
        Paragraph(
            "Alibaba is the high listing price at MOQ. To us, Ship, and Keep are "
            "planning ranges (light freight → heavy freight). Keep is after Alibaba, "
            "those pads, Stripe 2.9%+$0.30, and a 3% returns allowance. Customer pays "
            "$5.50 shipping under $40; free at $40+. Brush and glove stay restock lines; "
            "NestPaw sells them as the Shedding Brush Kit.",
            styles["intro"],
        )
    )
    story.append(storefront_table(styles))
    story.append(
        Paragraph(
            "Assumption only — not measured carrier rates. Solo-item order. "
            "Sell prices are set so Keep stays positive at the heavy end of freight.",
            styles["legend"],
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
