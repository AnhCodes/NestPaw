import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";
import { createInventoryPurchase } from "@/lib/orders";
import { getInventoryCatalogItem, inventoryCatalog } from "@/lib/inventory-catalog";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const vendor = String(form.get("vendor") ?? "Alibaba").trim() || "Alibaba";
  const totalCostRaw = String(form.get("totalCost") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();

  const totalCost = Number(totalCostRaw);
  if (!Number.isFinite(totalCost) || totalCost < 0) {
    return NextResponse.json({ error: "Invalid total cost" }, { status: 400 });
  }

  const items = inventoryCatalog
    .map((item) => {
      const raw = Number(form.get(`qty:${item.id}`) ?? 0);
      return {
        inventoryItemId: item.id,
        quantity: raw,
      };
    })
    .filter((item) => Number.isInteger(item.quantity) && item.quantity > 0)
    .filter((item) => getInventoryCatalogItem(item.inventoryItemId));

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Add at least one item quantity to log a purchase" },
      { status: 400 },
    );
  }

  await createInventoryPurchase({
    vendor,
    totalCostCents: Math.round(totalCost * 100),
    notes: notes || null,
    items,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/purchases/new");

  return NextResponse.redirect(new URL("/admin/inventory", request.url), {
    status: 303,
  });
}
