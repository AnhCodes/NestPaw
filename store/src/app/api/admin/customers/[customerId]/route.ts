import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";
import { updateCustomer } from "@/lib/orders";

async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return await verifyAdminSessionToken(token);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ customerId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerId } = await context.params;
  const form = await request.formData();
  const redirectUrl = new URL(`/admin/customers/${customerId}`, request.url);

  try {
    await updateCustomer(customerId, {
      email: String(form.get("email") ?? ""),
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
    });
    redirectUrl.searchParams.set("saved", "1");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not save customer";
    redirectUrl.searchParams.set(
      "error",
      message === "Another customer already uses that email"
        ? "email_taken"
        : message === "Email is required"
          ? "email_required"
          : "save_failed",
    );
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/orders");

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
