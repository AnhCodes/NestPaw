import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import type { SpendingReport } from "@/lib/admin-spend";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 50;
const CONTENT_BOTTOM = 52;
const MOSS = rgb(31 / 255, 61 / 255, 50 / 255);
const INK = rgb(17 / 255, 17 / 255, 17 / 255);
const MUTED = rgb(74 / 255, 87 / 255, 80 / 255);
const LINE = rgb(213 / 255, 221 / 255, 215 / 255);
const HEADER_FG = rgb(1, 1, 1);
const ROW_BG = rgb(244 / 255, 247 / 255, 245 / 255);

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatShare(part: number, whole: number) {
  if (whole <= 0) return "-";
  return `${Math.round((part / whole) * 100)}%`;
}

function toWinAnsi(text: string) {
  return text
    .replaceAll("…", "...")
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("\u00a0", " ")
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, "?");
}

function fitText(font: PDFFont, text: string, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  const ellipsis = "...";
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = `${text.slice(0, mid)}${ellipsis}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo === 0 ? ellipsis : `${text.slice(0, lo)}${ellipsis}`;
}

type Column = {
  label: string;
  width: number;
  align?: "left" | "right";
};

class ReportPdf {
  private readonly pdf: PDFDocument;
  private readonly font: PDFFont;
  private readonly fontBold: PDFFont;
  private page!: PDFPage;
  private y = 0;

  constructor(pdf: PDFDocument, font: PDFFont, fontBold: PDFFont) {
    this.pdf = pdf;
    this.font = font;
    this.fontBold = fontBold;
    this.addPage(true);
  }

  private addPage(first: boolean) {
    this.page = this.pdf.addPage([PAGE_W, PAGE_H]);
    this.y = first ? PAGE_H - 36 : PAGE_H - MARGIN;
    if (!first) {
      this.page.drawText("NestPaw spending report", {
        x: MARGIN,
        y: PAGE_H - 36,
        size: 9,
        font: this.fontBold,
        color: MOSS,
      });
      this.y = PAGE_H - 54;
    }
  }

  private ensureSpace(needed: number) {
    if (this.y - needed < CONTENT_BOTTOM) {
      this.addPage(false);
    }
  }

  private drawText(
    text: string,
    x: number,
    y: number,
    size: number,
    options?: { bold?: boolean; color?: RGB; width?: number; align?: "left" | "right" },
  ) {
    const font = options?.bold ? this.fontBold : this.font;
    const color = options?.color ?? INK;
    let drawn = toWinAnsi(text);
    let drawX = x;
    if (options?.width) {
      drawn = fitText(font, drawn, size, options.width);
      if (options.align === "right") {
        drawX = x + options.width - font.widthOfTextAtSize(drawn, size);
      }
    }
    this.page.drawText(drawn, { x: drawX, y, size, font, color });
  }

  header(generatedAt: Date) {
    this.page.drawRectangle({
      x: 0,
      y: PAGE_H - 72,
      width: PAGE_W,
      height: 72,
      color: MOSS,
    });
    this.drawText("NestPaw", MARGIN, PAGE_H - 32, 11, {
      bold: true,
      color: HEADER_FG,
    });
    this.drawText("Spending report", MARGIN, PAGE_H - 54, 20, {
      bold: true,
      color: HEADER_FG,
    });
    this.drawText(`Generated ${formatDate(generatedAt)}`, PAGE_W - MARGIN - 160, PAGE_H - 54, 9, {
      color: rgb(0.85, 0.9, 0.87),
      width: 160,
      align: "right",
    });
    this.y = PAGE_H - 96;
  }

  summary(report: SpendingReport) {
    const rows = [
      [
        {
          label: "Total spend",
          value: formatMoney(report.totalSpendCents),
          note: `${report.purchaseCount} purchase${report.purchaseCount === 1 ? "" : "s"}`,
        },
        {
          label: "Inventory",
          value: formatMoney(report.inventorySpendCents),
          note: `${report.inventoryLineCount} line${report.inventoryLineCount === 1 ? "" : "s"}`,
        },
        {
          label: "Operations",
          value: formatMoney(report.operationsSpendCents),
          note: `${report.operationsLineCount} line${report.operationsLineCount === 1 ? "" : "s"}`,
        },
      ],
      [
        {
          label: "Orders",
          value: String(report.orderCount),
          note: "Paid checkouts",
        },
        {
          label: "Revenue",
          value: formatMoney(report.revenueCents),
          note: `Avg ${formatMoney(report.averageOrderValueCents)}`,
        },
        {
          label: "Returns",
          value: String(report.returnCount),
          note:
            report.returnCount === 0
              ? "None yet"
              : `${formatMoney(report.returnCents)} approved`,
        },
      ],
    ];
    const boxH = 58;
    const gap = 8;

    for (const stats of rows) {
      const boxW = (PAGE_W - MARGIN * 2 - gap * (stats.length - 1)) / stats.length;
      this.ensureSpace(boxH + 8);
      stats.forEach((stat, index) => {
        const x = MARGIN + index * (boxW + gap);
        this.page.drawRectangle({
          x,
          y: this.y - boxH,
          width: boxW,
          height: boxH,
          color: ROW_BG,
          borderColor: LINE,
          borderWidth: 1,
        });
        this.drawText(stat.label, x + 12, this.y - 16, 8, { color: MUTED });
        this.drawText(stat.value, x + 12, this.y - 34, 14, { bold: true });
        this.drawText(stat.note, x + 12, this.y - 48, 8, { color: MUTED });
      });
      this.y -= boxH + 16;
    }
    this.y -= 6;
  }

  sectionTitle(title: string) {
    this.ensureSpace(36);
    this.drawText(title, MARGIN, this.y, 11, { bold: true, color: MOSS });
    this.y -= 8;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 1,
      color: MOSS,
    });
    this.y -= 14;
  }

  table(columns: Column[], rows: string[][], emptyMessage = "No purchases logged yet.") {
    const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const headerH = 18;
    const rowH = 16;
    const drawHeader = () => {
      this.ensureSpace(headerH + rowH);
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - headerH + 4,
        width: tableWidth,
        height: headerH,
        color: MOSS,
      });
      let x = MARGIN;
      for (const col of columns) {
        this.drawText(col.label, x + 6, this.y - 8, 8, {
          bold: true,
          color: HEADER_FG,
          width: col.width - 12,
          align: col.align,
        });
        x += col.width;
      }
      this.y -= headerH;
    };

    drawHeader();

    if (rows.length === 0) {
      this.ensureSpace(rowH);
      this.drawText(emptyMessage, MARGIN + 6, this.y - 4, 9, {
        color: MUTED,
      });
      this.y -= 22;
      return;
    }

    rows.forEach((cells, rowIndex) => {
      if (this.y - rowH < CONTENT_BOTTOM) {
        this.addPage(false);
        drawHeader();
      }
      if (rowIndex % 2 === 1) {
        this.page.drawRectangle({
          x: MARGIN,
          y: this.y - rowH + 4,
          width: tableWidth,
          height: rowH,
          color: ROW_BG,
        });
      }
      let x = MARGIN;
      cells.forEach((cell, colIndex) => {
        const col = columns[colIndex];
        this.drawText(cell, x + 6, this.y - 6, 8, {
          bold: colIndex === cells.length - 1,
          width: col.width - 12,
          align: col.align,
        });
        x += col.width;
      });
      this.y -= rowH;
    });
    this.y -= 16;
  }

  footers() {
    const pages = this.pdf.getPages();
    pages.forEach((page, index) => {
      page.drawText(
        `NestPaw spending report  ·  ${index + 1} of ${pages.length}`,
        {
          x: MARGIN,
          y: 28,
          size: 8,
          font: this.font,
          color: MUTED,
        },
      );
    });
  }
}

export async function buildSpendingReportPdf(report: SpendingReport) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("NestPaw spending report");
  pdf.setAuthor("NestPaw");
  pdf.setCreator("NestPaw admin");
  pdf.setCreationDate(report.generatedAt);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const writer = new ReportPdf(pdf, font, fontBold);

  writer.header(report.generatedAt);
  writer.summary(report);

  writer.sectionTitle("Categories");
  writer.table(
    [
      { label: "Category", width: 292 },
      { label: "Share", width: 90, align: "right" },
      { label: "Amount", width: 130, align: "right" },
    ],
    report.categories.map((row) => [
      row.label,
      formatShare(row.cents, report.totalSpendCents),
      formatMoney(row.cents),
    ]),
  );

  writer.sectionTitle("Vendors");
  writer.table(
    [
      { label: "Vendor", width: 292 },
      { label: "Share", width: 90, align: "right" },
      { label: "Amount", width: 130, align: "right" },
    ],
    report.vendors.map((row) => [
      row.vendor,
      formatShare(row.cents, report.vendorSum),
      formatMoney(row.cents),
    ]),
  );

  writer.sectionTitle("Items");
  writer.table(
    [
      { label: "Item", width: 252 },
      { label: "Category", width: 150 },
      { label: "Amount", width: 110, align: "right" },
    ],
    report.items.map((row) => [row.name, row.section, formatMoney(row.cents)]),
  );

  writer.sectionTitle("Returns");
  writer.table(
    [
      { label: "Date", width: 88 },
      { label: "Customer", width: 196 },
      { label: "Status", width: 118 },
      { label: "Amount", width: 110, align: "right" },
    ],
    report.returns.map((row) => [
      formatDate(row.date),
      row.email,
      row.statusLabel,
      formatMoney(row.amountCents),
    ]),
    "No returns yet.",
  );

  writer.sectionTitle("Purchases");
  writer.table(
    [
      { label: "Date", width: 88 },
      { label: "Vendor", width: 92 },
      { label: "Items", width: 222 },
      { label: "Amount", width: 110, align: "right" },
    ],
    report.purchases.map((purchase) => [
      formatDate(purchase.createdAt),
      purchase.vendor,
      purchase.itemNames.join(", ") || "-",
      formatMoney(purchase.totalCostCents),
    ]),
  );

  writer.footers();
  return Buffer.from(await pdf.save());
}
