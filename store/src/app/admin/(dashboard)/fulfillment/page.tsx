import { redirect } from "next/navigation";

export default function AdminFulfillmentRedirect() {
  redirect("/admin/orders");
}
