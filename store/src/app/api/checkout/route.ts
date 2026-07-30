import { NextResponse } from "next/server";
import { getProductByIdWithStock } from "@/lib/catalog";
import {
  FLAT_SHIPPING,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/products";
import {
  getSiteUrl,
  getStripe,
  randomCheckoutSuffix,
} from "@/lib/stripe";

type CartLine = {
  productId: string;
  quantity: number;
};

/** Stripe requires absolute http(s) image URLs; skip local-only paths. */
function toAbsoluteImageUrl(image: string, siteUrl: string): string | null {
  if (/^https?:\/\//i.test(image)) return image;
  if (!image.startsWith("/")) return null;
  try {
    const absolute = new URL(image, `${siteUrl}/`).toString();
    const host = new URL(absolute).hostname;
    if (host === "localhost" || host === "127.0.0.1") return null;
    return absolute;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Add STRIPE_SECRET_KEY_LOCAL (dev) or STRIPE_SECRET_KEY_LIVE (prod).",
      },
      { status: 503 },
    );
  }

  let body: { items?: CartLine[]; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const items = body.items ?? [];
  if (!items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const lineItems: {
    quantity: number;
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: {
        name: string;
        description?: string;
        images?: string[];
        metadata?: Record<string, string>;
      };
    };
  }[] = [];

  let subtotal = 0;
  const siteUrl = getSiteUrl();

  for (const item of items) {
    const product = await getProductByIdWithStock(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Unknown product: ${item.productId}` },
        { status: 400 },
      );
    }
    if (product.stock <= 0) {
      return NextResponse.json(
        { error: `${product.name} is out of stock` },
        { status: 400 },
      );
    }
    if (item.quantity < 1 || item.quantity > product.stock) {
      return NextResponse.json(
        {
          error: `Invalid quantity for ${product.name} (stock: ${product.stock})`,
        },
        { status: 400 },
      );
    }

    subtotal += product.price * item.quantity;
    const imageUrl = toAbsoluteImageUrl(product.image, siteUrl);
    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: product.name,
          description: product.tagline,
          ...(imageUrl ? { images: [imageUrl] } : {}),
          // Used by the webhook to map Stripe line items back to your catalog.
          metadata: { productId: product.id },
        },
      },
    });
  }

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;

  if (shipping > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(shipping * 100),
        product_data: {
          name: "Shipping",
          description: `Flat rate under $${FREE_SHIPPING_THRESHOLD}`,
          metadata: { productId: "shipping" },
        },
      },
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout`,
      customer_email: body.email || undefined,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      phone_number_collection: { enabled: true },
      integration_identifier: `nestpaw_checkout_${randomCheckoutSuffix()}`,
      metadata: {
        source: "nestpaw",
        fulfillment: "cj_alibaba_wholesale",
      },
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to create Checkout Session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
