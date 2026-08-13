import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";
import { deleteInvestor, updateInvestor } from "@/lib/investors";

async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return await verifyAdminSessionToken(token);
}

function parseAmountCents(value: FormDataEntryValue | null) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function parseInvestedAt(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return new Date();
  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ investorId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { investorId } = await context.params;
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save");

  try {
    if (intent === "delete") {
      await deleteInvestor(investorId);
    } else {
      const name = String(form.get("name") ?? "");
      const amountCents = parseAmountCents(form.get("amount"));
      const investedAt = parseInvestedAt(form.get("investedAt"));
      const notes = String(form.get("notes") ?? "");

      if (amountCents == null) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      if (!investedAt) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }

      await updateInvestor(investorId, {
        name,
        amountCents,
        notes,
        investedAt,
      });
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not update investor";
    const status = message === "Investor not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  revalidatePath("/admin/investors");
  return NextResponse.redirect(new URL("/admin/investors", request.url), {
    status: 303,
  });
}
