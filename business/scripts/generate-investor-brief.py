#!/usr/bin/env python3
"""Generate NestPaw investor idea brief — clean, readable typography."""

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
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

OUT = Path(__file__).resolve().parents[1] / "pdfs" / "nestpaw-investor-brief.pdf"

# Calm, high-contrast palette
MOSS = HexColor("#1a342c")
ACCENT = HexColor("#2a5c48")
INK = HexColor("#141816")
SOFT = HexColor("#3d4a44")
LINE = HexColor("#dfe5e1")
BG = HexColor("#f5f7f5")
RULE = HexColor("#cdd5d0")


def styles():
    # Readable hierarchy: title → section → body. Comfortable leading, not cramped.
    return {
        "title": ParagraphStyle(
            "title",
            fontName="Helvetica-Bold",
            fontSize=24,
            textColor=MOSS,
            leading=28,
            spaceAfter=4,
        ),
        "lede": ParagraphStyle(
            "lede",
            fontName="Helvetica",
            fontSize=10.5,
            textColor=SOFT,
            leading=15,
            spaceAfter=10,
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
            "body",
            fontName="Helvetica",
            fontSize=10,
            textColor=INK,
            leading=14.5,
            spaceAfter=4,
        ),
        "item": ParagraphStyle(
            "item",
            fontName="Helvetica",
            fontSize=10,
            textColor=INK,
            leading=14.5,
            leftIndent=14,
            firstLineIndent=-14,
            spaceAfter=3,
        ),
        "label": ParagraphStyle(
            "label",
            fontName="Helvetica-Bold",
            fontSize=7.5,
            textColor=ACCENT,
            leading=9,
            alignment=TA_CENTER,
            spaceAfter=2,
        ),
        "value": ParagraphStyle(
            "value",
            fontName="Helvetica",
            fontSize=9.5,
            textColor=INK,
            leading=12,
            alignment=TA_CENTER,
        ),
        "th": ParagraphStyle(
            "th",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            textColor=white,
            leading=11,
        ),
        "td": ParagraphStyle(
            "td",
            fontName="Helvetica",
            fontSize=9.5,
            textColor=INK,
            leading=12.5,
        ),
        "td_strong": ParagraphStyle(
            "td_strong",
            fontName="Helvetica-Bold",
            fontSize=9.5,
            textColor=INK,
            leading=12.5,
        ),
        "fine": ParagraphStyle(
            "fine",
            fontName="Helvetica",
            fontSize=8.5,
            textColor=SOFT,
            leading=12,
            spaceBefore=4,
        ),
        "callout": ParagraphStyle(
            "callout",
            fontName="Helvetica",
            fontSize=10,
            textColor=INK,
            leading=14.5,
        ),
        "footer": ParagraphStyle(
            "footer",
            fontName="Helvetica",
            fontSize=8,
            textColor=SOFT,
            leading=11,
            alignment=TA_CENTER,
        ),
    }


def meta_bar(s):
    cells_top = [
        Paragraph("LIVE STORE", s["label"]),
        Paragraph("MARKET", s["label"]),
        Paragraph("MODEL", s["label"]),
        Paragraph("STATUS", s["label"]),
    ]
    cells_bot = [
        Paragraph("shopnestpaw.com", s["value"]),
        Paragraph("U.S. dog owners", s["value"]),
        Paragraph("Wholesale → DTC", s["value"]),
        Paragraph("Soft-launch ready", s["value"]),
    ]
    t = Table([cells_top, cells_bot], colWidths=[1.7 * inch] * 4)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BG),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.6, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, 0), 7),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 1),
                ("TOPPADDING", (0, 1), (-1, 1), 1),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return t


def table(headers, rows, s, widths):
    data = [[Paragraph(h, s["th"]) for h in headers]]
    for row in rows:
        line = []
        for i, cell in enumerate(row):
            line.append(Paragraph(cell, s["td_strong"] if i == 0 else s["td"]))
        data.append(line)

    t = Table(data, colWidths=widths, repeatRows=1)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), MOSS),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
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
                ("LEFTPADDING", (0, 0), (-1, -1), 14),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    return box


def section_rule():
    return HRFlowable(
        width="100%",
        thickness=0.5,
        color=RULE,
        spaceBefore=1,
        spaceAfter=5,
    )


def build():
    s = styles()

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.65 * inch,
        title="NestPaw — Investor Brief",
        author="NestPaw",
    )

    story = []

    # ——— Page 1: the business ———
    story.append(Paragraph("NestPaw", s["title"]))
    story.append(
        Paragraph(
            "Investor brief on the idea, the demand, and how a focused dog brand "
            "competes without trying to become Amazon or Chewy.",
            s["lede"],
        )
    )
    story.append(meta_bar(s))

    story.append(Paragraph("The idea", s["section"]))
    story.append(section_rule())
    story.append(
        Paragraph(
            "NestPaw sells a small set of calm, comfort, and grooming products that help "
            "people care better for their dogs at home. We buy wholesale, sell direct on "
            "shopnestpaw.com, and fulfill simply from a U.S. ship-from address.",
            s["body"],
        )
    )

    story.append(Paragraph("Why this can sell", s["section"]))
    story.append(section_rule())
    story.append(
        Paragraph(
            "Dog owners already buy tools that cut mess, stress, and daily friction. "
            "NestPaw sells into that job-to-be-done — not novelty gadgets.",
            s["body"],
        )
    )
    for line in [
        "•  <b>Real home problems</b> — shedding, bored foraging, fast eating, nail stress, calming.",
        "•  <b>Year-round need</b> — utilitarian tools people search for, use, and replace.",
        "•  <b>Resilient spend</b> — pet budgets usually hold up better than fashion or gadgets.",
        "•  <b>Easy to show</b> — kits and mats photograph cleanly once the ad message works.",
    ]:
        story.append(Paragraph(line, s["item"]))

    story.append(Paragraph("What we sell", s["section"]))
    story.append(section_rule())
    story.append(
        Paragraph(
            "Five SKUs only. A tight catalog lowers inventory risk and makes winners obvious.",
            s["body"],
        )
    )
    story.append(
        KeepTogether(
            [
                table(
                    ["Product", "Price", "Landed cost*", "Contribution*"],
                    [
                        ["Shedding Brush Kit", "$29", "~$13", "Strong"],
                        ["Forage Snuffle Mat", "$44", "~$21", "Strong"],
                        ["Silicone Slow Feeder Mat", "$29", "~$13", "Strong"],
                        ["Quiet Nail Grinder", "$29", "~$14", "Solid"],
                        ["Suction Lick Mat", "$14", "Low $", "Entry / attach"],
                    ],
                    s,
                    [2.35 * inch, 0.9 * inch, 1.55 * inch, 2.0 * inch],
                ),
                Paragraph(
                    "*Landed ≈ product + inbound freight (planning). Contribution is after outbound "
                    "shipping, Stripe, and a returns pad. Full math: nestpaw-product-catalog.pdf",
                    s["fine"],
                ),
            ]
        )
    )

    story.append(Paragraph("How money works", s["section"]))
    story.append(section_rule())
    story.append(
        KeepTogether(
            [
                Paragraph(
                    "Buy below retail, sell branded, keep the margin after ads and shipping. "
                    "Customers pay <b>$4.95 shipping under $40</b>; free shipping over $40. "
                    "We start with Alibaba / CJ samples, bulk-reorder only what sells, and self-ship "
                    "week one (Pirate Ship + USPS). Stack: NestPaw + Stripe + Postgres + Resend.",
                    s["body"],
                ),
            ]
        )
    )

    # ——— Competition + proof ———
    story.append(
        KeepTogether(
            [
                Paragraph("Competing with Amazon, Chewy &amp; big box", s["section"]),
                section_rule(),
                Paragraph(
                    "We are not trying to out-warehouse Amazon or match Chewy’s catalog. "
                    "They win on scale and assortment. We win a smaller, clearer game.",
                    s["body"],
                ),
                Spacer(1, 3),
                table(
                    ["", "Amazon / Chewy", "NestPaw"],
                    [
                        ["Assortment", "Everything for pets", "Five calm-home / grooming SKUs"],
                        [
                            "Discovery",
                            "Search rank & marketplace noise",
                            "Brand story + targeted ads",
                        ],
                        [
                            "Customer",
                            "Platform owns the relationship",
                            "Orders, email & returns on our stack",
                        ],
                        [
                            "Margins",
                            "Fees + race to the bottom",
                            "Wholesale → DTC room for ads",
                        ],
                        [
                            "Unboxing",
                            "Generic third-party box",
                            "Brand pack + calm tips card",
                        ],
                        [
                            "Inventory",
                            "Scale first, fix later",
                            "Samples → soft launch → winners only",
                        ],
                        [
                            "Delivery",
                            "Same-day / next-day depth",
                            "Honest 5–8 day ship; ship in 24h when stocked",
                        ],
                    ],
                    s,
                    [1.2 * inch, 2.55 * inch, 3.05 * inch],
                ),
            ]
        )
    )
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "Amazon and Chewy win when someone needs anything tomorrow and brand does not matter. "
            "NestPaw is for owners who want a calmer home kit they recognize — packed like a brand, "
            "not a random listing.",
            s["body"],
        )
    )
    for line in [
        "•  <b>Do not compete on logistics scale</b> — that is their capital game.",
        "•  <b>Compete on trust and clarity</b> — one promise, one site, real support.",
        "•  <b>Compete on unit economics</b> — wholesale costs leave room for ads and free-ship rules.",
        "•  <b>Compete on learning speed</b> — five SKUs answer “does it sell?” in a soft launch.",
    ]:
        story.append(Paragraph(line, s["item"]))

    story.append(Paragraph("How we prove it sells", s["section"]))
    story.append(section_rule())
    story.append(
        Paragraph(
            "Demand is proven by paid orders, not a larger pitch deck.",
            s["body"],
        )
    )
    for line in [
        "1.  <b>Store first</b> — live checkout, inventory, orders, and shipping email already work.",
        "2.  <b>Samples before bulk</b> — QA quality and real ship times first.",
        "3.  <b>Soft launch</b> — friends/family + small ads; track conversion and CAC by SKU.",
        "4.  <b>Kill or double</b> — reorder winners; drop losers with little sunk cost.",
        "5.  <b>Then scale creative</b> — video/ads only after first orders validate the message.",
    ]:
        story.append(Paragraph(line, s["item"]))

    story.append(Spacer(1, 8))
    story.append(
        KeepTogether(
            [
                callout(
                    "<b>Bottom line.</b> NestPaw does not need to beat Amazon at Amazon’s game. "
                    "It needs to convert paid visits into profitable orders, own the customer, "
                    "and scale only what sells — proven by a live pipeline, not by matching "
                    "big-retail catalog size.",
                    s,
                ),
                Spacer(1, 10),
                Paragraph(
                    "shopnestpaw.com  ·  catalog: nestpaw-product-catalog.pdf  ·  ops: PACK-SHIP.md",
                    s["footer"],
                ),
            ]
        )
    )

    def on_page(canvas, doc_):
        canvas.saveState()
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.5)
        y = 0.4 * inch
        canvas.line(0.85 * inch, y + 10, letter[0] - 0.85 * inch, y + 10)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(SOFT)
        canvas.drawString(0.85 * inch, y, "NestPaw  ·  Investor brief")
        canvas.drawRightString(
            letter[0] - 0.85 * inch,
            y,
            f"Confidential  ·  {doc_.page}",
        )
        canvas.restoreState()

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    build()
