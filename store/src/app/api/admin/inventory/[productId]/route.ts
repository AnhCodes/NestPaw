import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { getInventoryCatalogItem } from "@/lib/inventory-catalog";
import { inventory } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await context.params;
  const inventoryItem = getInventoryCatalogItem(productId);
  if (!inventoryItem) {
    return NextResponse.json({ error: "Unknown inventory item" }, { status: 404 });
  }

  const form = await request.formData();
  const stock = Number(form.get("stock"));
  const lowStockThreshold = Number(form.get("lowStockThreshold"));

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

  const db = getDb();
  await db
    .insert(inventory)
    .values({
      productId,
      stock,
      lowStockThreshold,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: inventory.productId,
      set: {
        stock,
        lowStockThreshold,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");

  return NextResponse.redirect(new URL("/admin/inventory", request.url), {
    status: 303,
  });
}
