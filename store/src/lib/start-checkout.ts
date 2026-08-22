export async function startStripeCheckout(
  items: { productId: string; quantity: number }[],
): Promise<{ url?: string; error?: string }> {
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      return { error: data.error || "Checkout failed. Please try again." };
    }
    return { url: data.url };
  } catch {
    return { error: "Network error starting Stripe Checkout." };
  }
}