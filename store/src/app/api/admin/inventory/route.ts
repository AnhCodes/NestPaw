import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ADMIN_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import type { InventorySection } from "@/lib/inventory-catalog";
import { createCustomInventoryItem } from "@/lib/inventory";

const sections = new Set<InventorySection>([
  "store-products",
  "treats",
  "printed-materials",
  "shipping-supplies",
  "business-ops",
]);

async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const name = String(form.get("name") ?? "");
  const section = String(form.get("section") ?? "") as InventorySection;
  const stock = Number(form.get("stock") ?? 0);
  const lowStockThreshold = Number(form.get("lowStockThreshold") ?? 3);
  const tracksStock = String(form.get("tracksStock") ?? "true") !== "false";

  if (!sections.has(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }
  if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
    return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
  }
  if (
    !Number.isFinite(lowStockThreshold) ||
    lowStockThreshold < 0 ||
    !Number.isInteger(lowStockThreshold)
  ) {
    return NextResponse.json({ error: "Invalid threshold" }, { status: 400 });
  }

  try {
    await createCustomInventoryItem({
      name,
      section,
      stock,
      lowStockThreshold,
      tracksStock,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create item";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/inventory");

  return NextResponse.redirect(new URL("/admin/inventory", request.url), {
    status: 303,
  });
}
