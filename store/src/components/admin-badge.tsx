export function AdminBadge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "ok" | "warn" | "danger";
  children: React.ReactNode;
}) {
  return <span className={`admin-badge admin-badge-${tone}`}>{children}</span>;
}

export function fulfillmentTone(status: string) {
  if (status === "shipped") return "ok" as const;
  if (status === "packed") return "neutral" as const;
  return "warn" as const;
}

export function paymentTone(status: string | null | undefined) {
  if (status === "paid") return "ok" as const;
  if (status === "refunded" || status === "canceled") return "danger" as const;
  return "neutral" as const;
}
