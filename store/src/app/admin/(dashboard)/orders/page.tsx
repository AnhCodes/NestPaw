import Link from "next/link";
import { formatPrice } from "@/lib/products";
import { listOrdersWithItems } from "@/lib/orders";
import type { FulfillmentStatus, OrderItem } from "@/lib/db/schema";
import { AdminBadge, returnTone } from "@/components/admin-badge";
import { DeleteOrderButton } from "@/components/delete-order-button";
import { EditCustomerButton } from "@/components/edit-customer-button";
import { ShipOrderButton } from "@/components/ship-order-button";

function formatCents(cents: number | null | undefined) {
  if (cents == null) return "—";
  return formatPrice(cents / 100);
}

function shippedEmailMessage(value: string | undefined) {
  switch (value) {
    case "sent":
      return {
        tone: "ok" as const,
        text: "Marked shipped. Shipping email sent to the customer.",
      };
    case "error":
      return {
        tone: "warn" as const,
        text: "Marked shipped, but the shipping email failed to send.",
      };
    case "needs_tracking":
      return {
        tone: "warn" as const,
        text: "Marked as shipped, but no tracking number was added, so no customer email was sent.",
      };
    case "tracking_mismatch":
      return {
        tone: "warn" as const,
        text: "Tracking numbers did not match. Nothing was saved.",
      };
    case "saved":
      return {
        tone: "ok" as const,
        text: "Fulfillment saved.",
      };
    default:
      return null;
  }
}

const columns: {
  status: FulfillmentStatus;
  title: string;
  hint: string;
}[] = [
  {
    status: "unfulfilled",
    title: "To pack",
    hint: "Paid, waiting to box.",
  },
  {
    status: "packed",
    title: "Packed",
    hint: "Ready for a label.",
  },
  {
    status: "shipped",
    title: "Shipped",
    hint: "Tracking emailed.",
  },
];

function customerErrorMessage(value: string | undefined) {
  switch (value) {
    case "email_required":
      return "Email is required.";
    case "email_taken":
      return "Another customer already uses that email.";
    case "save_failed":
      return "Could not save customer details. Try again.";
    default:
      return null;
  }
}

function formatOrderDate(value: Date) {
  const now = new Date();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(value.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  }).format(value);
}

function locationSummary(address: Record<string, string>) {
  const parts = [address.city, address.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function itemSummary(items: OrderItem[]) {
  if (items.length === 0) return "No items";
  const first = items[0];
  const label =
    first.quantity > 1 ? `${first.name} × ${first.quantity}` : first.name;
  if (items.length === 1) return label;
  const extra = items.length - 1;
  return `${label} + ${extra} more`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    shippedEmail?: string;
    customerSaved?: string;
    customerError?: string;
    orderDeleted?: string;
  }>;
}) {
  const query = await searchParams;
  const orders = await listOrdersWithItems();
  const notice = shippedEmailMessage(query.shippedEmail);
  const customerError = customerErrorMessage(query.customerError);

  return (
    <div>
      <h1 className="text-[1.65rem] font-semibold tracking-tight">
        Orders and Fulfillment
      </h1>
      <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
        Pack, then ship. Edit contact or address on the card without leaving the
        board.
      </p>

      {notice ? (
        <p
          className={`admin-notice mt-4 ${
            notice.tone === "warn" ? "admin-notice-warn" : "admin-notice-ok"
          }`}
        >
          {notice.text}
        </p>
      ) : null}
      {query.customerSaved === "1" ? (
        <p className="admin-notice admin-notice-ok mt-4">
          Customer details saved.
        </p>
      ) : null}
      {customerError ? (
        <p className="admin-notice admin-notice-warn mt-4">{customerError}</p>
      ) : null}
      {query.orderDeleted === "1" ? (
        <p className="admin-notice admin-notice-ok mt-4">Order deleted.</p>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {columns.map((column) => {
          const cards = orders.filter(
            ({ order }) => order.fulfillmentStatus === column.status,
          );

          return (
            <section
              key={column.status}
              className="admin-card flex min-h-[28rem] flex-col"
            >
              <div className="border-b border-[color:var(--admin-border)] px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-sm font-semibold">{column.title}</h2>
                  <span className="text-xs font-medium text-[color:var(--admin-subtle)]">
                    {cards.length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[color:var(--admin-muted)]">
                  {column.hint}
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-3">
                {cards.length === 0 ? (
                  <p className="px-1 py-6 text-sm text-[color:var(--admin-muted)]">
                    None.
                  </p>
                ) : (
                  cards.map(({ order, customer, items }) => {
                    const address = (order.shippingAddress ?? {}) as Record<
                      string,
                      string
                    >;
                    const displayName = (
                      order.shippingName ||
                      customer.name ||
                      ""
                    ).trim();
                    const title = displayName || customer.email;
                    const location = locationSummary(address);
                    const dateLabel = order.createdAt
                      ? formatOrderDate(new Date(order.createdAt))
                      : null;
                    const meta = [
                      location,
                      dateLabel,
                      column.status === "shipped"
                        ? order.trackingNumber
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ");

                    return (
                      <article
                        key={order.id}
                        className="relative rounded-xl border border-[color:var(--admin-border)] bg-[var(--admin-surface-soft)] p-3.5"
                      >
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="admin-row-link"
                          aria-label={`Open order for ${customer.email}`}
                        />
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 truncate font-medium">
                            {title}
                          </p>
                          <p className="shrink-0 text-sm font-medium tabular-nums">
                            {formatCents(order.amountTotal)}
                          </p>
                        </div>
                        {displayName ? (
                          <p className="mt-0.5 truncate text-xs text-[color:var(--admin-subtle)]">
                            {customer.email}
                          </p>
                        ) : null}
                        <p className="mt-1 truncate text-sm text-[color:var(--admin-muted)]">
                          {itemSummary(items)}
                        </p>
                        {meta ? (
                          <p className="mt-1 truncate text-xs text-[color:var(--admin-subtle)]">
                            {meta}
                          </p>
                        ) : null}
                        {order.returnStatus !== "none" ? (
                          <div className="mt-2">
                            <AdminBadge tone={returnTone(order.returnStatus)}>
                              {order.returnStatus}
                            </AdminBadge>
                          </div>
                        ) : null}
                        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2">
                          {column.status === "unfulfilled" ? (
                            <form
                              action={`/api/admin/orders/${order.id}`}
                              method="post"
                              className="inline-flex"
                            >
                              <input
                                type="hidden"
                                name="intent"
                                value="fulfillment"
                              />
                              <input
                                type="hidden"
                                name="fulfillmentStatus"
                                value="packed"
                              />
                              <input
                                type="hidden"
                                name="trackingNumber"
                                value={order.trackingNumber ?? ""}
                              />
                              <input
                                type="hidden"
                                name="trackingNumberConfirm"
                                value={order.trackingNumber ?? ""}
                              />
                              <input
                                type="hidden"
                                name="redirectTo"
                                value="/admin/orders"
                              />
                              <button type="submit" className="btn-primary">
                                Mark packed
                              </button>
                            </form>
                          ) : null}
                          {column.status === "packed" ? (
                            <ShipOrderButton
                              orderId={order.id}
                              trackingNumber={order.trackingNumber ?? ""}
                            />
                          ) : null}
                          <EditCustomerButton
                            orderId={order.id}
                            customer={{
                              email: customer.email,
                              name: order.shippingName || customer.name || "",
                              phone: order.shippingPhone || customer.phone || "",
                              line1: address.line1 ?? "",
                              line2: address.line2 ?? "",
                              city: address.city ?? "",
                              state: address.state ?? "",
                              postalCode: address.postal_code ?? "",
                              country: address.country || "US",
                            }}
                          />
                          <DeleteOrderButton orderId={order.id} />
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
