import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";
import { createInventoryPurchase } from "@/lib/orders";
import { getMergedInventoryCatalog } from "@/lib/inventory";
import { purchaseVendors } from "@/lib/inventory-catalog";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return await verifyAdminSessionToken(token);
}

type PurchaseBody = {
  vendor?: string;
  notes?: string;
  items?: {
    inventoryItemId?: string;
    quantity?: number;
    price?: number;
  }[];
};

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PurchaseBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const allowedVendors = new Set<string>(purchaseVendors);
  const vendorRaw = String(body.vendor ?? "Amazon").trim();
  const vendor = allowedVendors.has(vendorRaw) ? vendorRaw : null;
  if (!vendor) {
    return NextResponse.json(
      { error: `Vendor must be ${purchaseVendors.join(", ")}` },
      { status: 400 },
    );
  }
  const notes = String(body.notes ?? "").trim();
  const catalogIds = new Set(
    (await getMergedInventoryCatalog()).map((item) => item.id),
  );

  const items = (body.items ?? [])
    .map((item) => ({
      inventoryItemId: String(item.inventoryItemId ?? "").trim(),
      quantity: Number(item.quantity),
      price: Number(item.price),
    }))
    .filter(
      (item) =>
        catalogIds.has(item.inventoryItemId) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(item.price) &&
        item.price >= 0,
    )
    .map((item) => ({
      inventoryItemId: item.inventoryItemId,
      quantity: item.quantity,
      lineCostCents: Math.round(item.price * 100),
    }));

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Add at least one item with quantity and price" },
      { status: 400 },
    );
  }

  const totalCostCents = items.reduce((sum, item) => sum + item.lineCostCents, 0);

  await createInventoryPurchase({
    vendor,
    totalCostCents,
    notes: notes || null,
    items,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/purchases/new");

  return NextResponse.json({ ok: true });
}
