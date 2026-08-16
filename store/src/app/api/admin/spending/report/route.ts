import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";
import { getSpendingReport } from "@/lib/admin-spend";
import { buildSpendingReportPdf } from "@/lib/spending-report-pdf";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return await verifyAdminSessionToken(token);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await getSpendingReport();
  const pdf = await buildSpendingReportPdf(report);
  const dateStamp = report.generatedAt.toISOString().slice(0, 10);
  const filename = `nestpaw-spending-${dateStamp}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
