import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import {
  isBuiltinCatalogItem,
  removeInventoryItem,
  resolveInventoryCatalogItem,
} from "@/lib/inventory";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return await verifyAdminSessionToken(token);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await context.params;
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "save");

  if (intent === "delete") {
    try {
      await removeInventoryItem(productId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not remove item";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/inventory");
    const redirectTo = String(form.get("redirectTo") ?? "/admin/inventory");
    const safeRedirect =
      redirectTo === "/admin" || redirectTo.startsWith("/admin/")
        ? redirectTo
        : "/admin/inventory";
    return NextResponse.redirect(new URL(safeRedirect, request.url), {
      status: 303,
    });
  }

  const inventoryItem = await resolveInventoryCatalogItem(productId);
  if (!inventoryItem) {
    return NextResponse.json({ error: "Unknown inventory item" }, { status: 404 });
  }

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

  const custom = !isBuiltinCatalogItem(productId);
  const db = getDb();
  await db
    .insert(inventory)
    .values({
      productId,
      name: custom ? inventoryItem.name : null,
      section: custom ? inventoryItem.section : null,
      stock,
      storefrontStock: 0,
      lowStockThreshold,
      tracksStock: inventoryItem.tracksStock !== false,
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

  revalidatePath("/admin");
  revalidatePath("/admin/inventory");

  return NextResponse.redirect(new URL("/admin/inventory", request.url), {
    status: 303,
  });
}
