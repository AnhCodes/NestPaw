"use client";

export function DeleteOrderButton({
  orderId,
  redirectTo = "/admin/orders",
}: {
  orderId: string;
  redirectTo?: string;
}) {
  return (
    <form
      action={`/api/admin/orders/${orderId}`}
      method="post"
      className="relative z-10"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Delete this order from admin? Paid orders restore inventory. If this was the customer's only order, their customer record is removed too.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="intent" value="delete" />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button
        type="submit"
        className="rounded-md px-2 py-1.5 text-xs font-medium text-[color:var(--admin-danger-fg)] hover:underline"
      >
        Delete
      </button>
    </form>
  );
}
