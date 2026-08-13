import { formatStock, isInStock, type Product } from "@/lib/products";

export function StockStatus({
  product,
  tone = "dark",
}: {
  product: Product;
  tone?: "dark" | "light" | "badge";
}) {
  const available = isInStock(product);

  if (tone === "badge") {
    return (
      <span
        className={`inline-block rounded-full px-2.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm ${
          available
            ? "bg-mist/95 text-accent"
            : "bg-ink/85 text-mist"
        }`}
      >
        {available ? formatStock(product) : "Out of stock"}
      </span>
    );
  }

  const light = tone === "light";

  return (
    <p
      className={`text-[0.7rem] font-semibold uppercase tracking-[0.14em] ${
        available
          ? light
            ? "text-mist/85"
            : "text-accent"
          : light
            ? "text-mist/55"
            : "text-ink/45"
      }`}
    >
      {available ? formatStock(product) : "Out of stock · 0 left"}
    </p>
  );
}
