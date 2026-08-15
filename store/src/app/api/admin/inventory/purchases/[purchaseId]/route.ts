import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";
import { getMergedInventoryCatalog } from "@/lib/inventory";
import { updateInventoryPurchase } from "@/lib/orders";
import { purchaseVendors } from "@/lib/inventory-catalog";

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

async function parsePurchaseBody(body: PurchaseBody) {
  const allowedVendors = new Set<string>(purchaseVendors);
  const vendorRaw = String(body.vendor ?? "Amazon").trim();
  const vendor = allowedVendors.has(vendorRaw) ? vendorRaw : null;
  if (!vendor) {
    return {
      error: `Vendor must be ${purchaseVendors.join(", ")}`,
    } as const;
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
    return {
      error: "Add at least one item with quantity and price",
    } as const;
  }

  return {
    vendor,
    notes: notes || null,
    items,
    totalCostCents: items.reduce((sum, item) => sum + item.lineCostCents, 0),
  } as const;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ purchaseId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { purchaseId } = await context.params;

  let body: PurchaseBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = await parsePurchaseBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await updateInventoryPurchase(purchaseId, {
      vendor: parsed.vendor,
      totalCostCents: parsed.totalCostCents,
      notes: parsed.notes,
      items: parsed.items,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to update purchase";
    const status = message === "Purchase not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/purchases/${purchaseId}`);

  return NextResponse.json({ ok: true });
}
