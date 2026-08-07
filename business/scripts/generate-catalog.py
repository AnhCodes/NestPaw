#!/usr/bin/env python3
"""Generate NestPaw product catalog PDF with clean typography."""

from datetime import date
from pathlib import Path
import random

from reportlab.graphics.shapes import Circle, Drawing, Line, Rect, String
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
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
PROFIT = HexColor("#2f6b4f")  # make money
LOSS = HexColor("#a14a3c")  # lose money
DOT_ZERO = HexColor("#b0b8b3")

# Free ship on NestPaw orders ≥ $40; customer pays $5.50 under.
FREE_SHIP_AT = 40.0
CUSTOMER_SHIP_FEE = 5.5
STRIPE_PCT = 0.029
STRIPE_FIXED = 0.30
RETURNS_PCT = 0.03

# Freight planning pads (per unit). Product rows show To us / Ship / Keep as ranges.
TO_US_LOW, TO_US_MED, TO_US_HIGH = 3.0, 6.0, 12.0
SHIP_LOW, SHIP_MED, SHIP_HIGH = 5.0, 7.0, 12.0
# Match money() two-decimal width so range columns align with Sell/Alibaba.
# U+2011 non-breaking hyphen — looks like a dash, won't wrap mid-range.
RANGE_JOIN = "\u2011"
TO_US_RANGE = f"${TO_US_LOW:.2f}{RANGE_JOIN}${TO_US_HIGH:.2f}"
SHIP_RANGE = f"${SHIP_LOW:.2f}{RANGE_JOIN}${SHIP_HIGH:.2f}"



# Brush / glove components (restock MOQ 50 — glove-limited)
# Comb: Alibaba app quote $3.15/pc · supplier MOQ 10; catalog MOQ 50
# Gloves: Alibaba app quote $2.94/pc · order of 50
# NestPaw sells both together as Shedding Brush Kit ($24)
COMB_UNIT = 3.15
COMB_MOQ = 50  # restock limited by glove MOQ 50
GLOVE_UNIT = 2.94
GLOVE_MOQ = 50
GLOVE_MOQ_PRICE = round(GLOVE_UNIT * GLOVE_MOQ, 2)  # $147.00
KIT_SELL = 24.0
KIT_ALIBABA = round(COMB_UNIT + GLOVE_UNIT, 2)  # unit cost of both parts
KIT_MOQ = 50
KIT_MOQ_PRICE = round(
    COMB_UNIT * COMB_MOQ + GLOVE_UNIT * GLOVE_MOQ, 2
)  # full restock of 50 kits worth of parts

# Snuffle (Alibaba app quote): $45.04/pc · MOQ 90
SNUFFLE_UNIT = 45.04
SNUFFLE_MOQ = 90
SNUFFLE_MOQ_PRICE = round(SNUFFLE_UNIT * SNUFFLE_MOQ, 2)  # $4,053.60

# Slow feeder (Alibaba app quote): $19.12/pc · MOQ 200
SLOW_FEEDER_UNIT = 19.12
SLOW_FEEDER_MOQ = 200
SLOW_FEEDER_MOQ_PRICE = round(SLOW_FEEDER_UNIT * SLOW_FEEDER_MOQ, 2)  # $3,824.00

# Nail grinder — Alibaba app quote $10.79/pc · MOQ 1
NAIL_UNIT = 10.79
NAIL_MOQ = 1
NAIL_MOQ_PRICE = round(NAIL_UNIT * NAIL_MOQ, 2)


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
    """Keep under heavy vs light freight; floor at $0 (no negative floors)."""
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
        "alibaba_label": money(KIT_ALIBABA),
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
        "sell": 69.0,
        "alibaba": SNUFFLE_UNIT,
        "moq_label": str(SNUFFLE_MOQ),
        "moq_price": SNUFFLE_MOQ_PRICE,
    },
    {
        "product": "Silicone Slow Feeder Mat",
        "sell": 34.0,
        "alibaba": SLOW_FEEDER_UNIT,
        "moq_label": str(SLOW_FEEDER_MOQ),
        "moq_price": SLOW_FEEDER_MOQ_PRICE,
    },
    {
        "product": "Quiet Nail Grinder",
        "sell": 25.0,
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
            1.70 * inch,  # Product
            0.60 * inch,  # Sell
            0.68 * inch,  # Alibaba
            0.45 * inch,  # MOQ
            0.82 * inch,  # MOQ $
            1.05 * inch,  # To us
            1.05 * inch,  # Ship
            1.05 * inch,  # Keep
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


# ── Outcome odds (Monte Carlo over freight) ──────────────────────────────────

MC_N = 10_000
MC_SEED = 42
DOT_N = 48  # dots shown per product row


def sold_products() -> list[dict]:
    return [item for item in STORE if item.get("sell") is not None]


def simulate_keeps(sell: float, alibaba: float, n: int = MC_N, seed: int = MC_SEED):
    rng = random.Random(seed + hash((sell, alibaba)) % 10_000)
    keeps = []
    for _ in range(n):
        to_us = rng.uniform(TO_US_LOW, TO_US_HIGH)
        ship = rng.uniform(SHIP_LOW, SHIP_HIGH)
        keeps.append(keep_contribution(sell, alibaba, to_us, ship))
    return keeps


def outcome_stats(keeps: list[float]) -> dict:
    n = len(keeps)
    wins = sum(1 for k in keeps if k > 0)
    losses = n - wins
    ordered = sorted(keeps)
    return {
        "n": n,
        "profit_pct": 100.0 * wins / n,
        "loss_pct": 100.0 * losses / n,
        "median": ordered[n // 2],
        "mean": sum(keeps) / n,
        "dot_keeps": ordered[:: max(1, n // DOT_N)][:DOT_N],
    }


def outcome_odds_drawing(width: float) -> Drawing:
    """Per product: label, sorted keep dots (loss→profit), profit/loss %."""
    items = sold_products()
    stats = []
    for item in items:
        keeps = simulate_keeps(item["sell"], item["alibaba"])
        stats.append((item, outcome_stats(keeps)))

    row_h = 36
    top_pad = 8
    bot_pad = 18
    height = top_pad + bot_pad + row_h * len(stats)
    d = Drawing(width, height)

    # Axis bounds from all sample dots (so rows share scale)
    all_k = [k for _, st in stats for k in st["dot_keeps"]]
    k_min = min(all_k + [-2.0])
    k_max = max(all_k + [2.0])
    # Expand a little
    pad = (k_max - k_min) * 0.08 or 1.0
    k_min -= pad
    k_max += pad

    label_w = 1.55 * inch
    pct_w = 1.35 * inch
    plot_x0 = label_w + 6
    plot_x1 = width - pct_w - 4
    plot_w = plot_x1 - plot_x0
    zero_x = plot_x0 + (0 - k_min) / (k_max - k_min) * plot_w

    # Shared zero axis (behind dots)
    d.add(
        Line(
            zero_x,
            bot_pad - 4,
            zero_x,
            height - top_pad + 2,
            strokeColor=RULE,
            strokeWidth=0.8,
            strokeDashArray=[2, 2],
        )
    )

    for i, (item, st) in enumerate(stats):
        y_mid = height - top_pad - row_h * i - row_h / 2

        # Alternating row wash
        if i % 2 == 0:
            d.add(
                Rect(
                    0,
                    y_mid - row_h / 2 + 2,
                    width,
                    row_h - 4,
                    fillColor=BG,
                    strokeColor=None,
                )
            )

        # Product name — shorten long display if needed for one line
        short_name = {
            "Silicone Slow Feeder Mat": "Slow Feeder Mat",
            "Quiet Nail Grinder": "Nail Grinder",
            "Forage Snuffle Mat": "Snuffle Mat",
            "Shedding Brush Kit": "Brush Kit",
        }.get(item["product"], item["product"])
        d.add(
            String(
                4,
                y_mid - 3,
                short_name,
                fontName="Helvetica-Bold",
                fontSize=8,
                fillColor=INK,
            )
        )

        # Dots sorted left (more loss) → right (more profit)
        r = 3.2
        for k in st["dot_keeps"]:
            x = plot_x0 + (k - k_min) / (k_max - k_min) * plot_w
            if k > 0.15:
                fill = PROFIT
            elif k < -0.15:
                fill = LOSS
            else:
                fill = DOT_ZERO
            d.add(
                Circle(
                    x,
                    y_mid,
                    r,
                    fillColor=fill,
                    strokeColor=white,
                    strokeWidth=0.4,
                )
            )

        # Profit / loss percentages — glued so they stay one line each
        d.add(
            String(
                width - pct_w + 2,
                y_mid + 4,
                f"{st['profit_pct']:.0f}% profit",
                fontName="Helvetica-Bold",
                fontSize=8,
                fillColor=PROFIT,
            )
        )
        d.add(
            String(
                width - pct_w + 2,
                y_mid - 8,
                f"{st['loss_pct']:.0f}% loss",
                fontName="Helvetica",
                fontSize=8,
                fillColor=LOSS,
            )
        )

    # Axis labels under last row
    d.add(
        String(
            plot_x0,
            4,
            "← more loss",
            fontName="Helvetica",
            fontSize=7,
            fillColor=MUTED,
        )
    )
    d.add(
        String(
            zero_x - 10,
            4,
            "$0",
            fontName="Helvetica",
            fontSize=7,
            fillColor=MUTED,
        )
    )
    d.add(
        String(
            plot_x1 - 52,
            4,
            "more profit →",
            fontName="Helvetica",
            fontSize=7,
            fillColor=MUTED,
        )
    )

    return d


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

    content_w = letter[0] - 2 * MARGIN_X

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
            "Retail price, unit Alibaba cost, MOQ restock cash, and contribution ranges. "
            "To us, Ship, and Keep are planning ranges (light freight → heavy freight). "
            "Keep floors at $0.00 when heavy freight would erase contribution. "
            "Brush and glove stay restock lines; NestPaw sells them as the Shedding Brush Kit.",
            styles["intro"],
        )
    )
    story.append(storefront_table(styles))
    story.append(Spacer(1, 18))

    story.append(Paragraph("Chance of profit vs loss", styles["section"]))
    story.append(
        Paragraph(
            "Each unit’s Keep depends on unknown freight. We treat inbound To us as "
            f"uniform {TO_US_RANGE} and US Ship as uniform {SHIP_RANGE} "
            f"(independent draws, {MC_N:,} simulations). "
            "Each green or red dot is one freight draw for that SKU, ordered left→right by Keep. "
            "Green = profit after fees; red = loss. Dash = break-even.",
            styles["chartIntro"],
        )
    )
    story.append(outcome_odds_drawing(content_w))
    story.append(
        Paragraph(
            "Assumption only — not measured carrier rates. Solo-item order, Stripe 2.9%+$0.30, "
            f"3% returns pad, ship fee ${CUSTOMER_SHIP_FEE:.2f} when sell is under ${FREE_SHIP_AT:.0f}. "
            "Brush kit components are omitted (sold only as the kit).",
            styles["legend"],
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
