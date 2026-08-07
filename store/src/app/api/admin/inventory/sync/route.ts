import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";
import { syncStockToStorefront } from "@/lib/inventory";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return await verifyAdminSessionToken(token);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncStockToStorefront();

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/products");
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");

  return NextResponse.redirect(new URL("/admin/inventory?synced=1", request.url), {
    status: 303,
  });
}
