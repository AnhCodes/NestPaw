import { NextResponse } from "next/server";
import {
  FLAT_SHIPPING,
  FREE_SHIPPING_THRESHOLD,
  products,
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

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Add STRIPE_SECRET_KEY to store/.env.local",
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
      product_data: { name: string; description?: string; images?: string[] };
    };
  }[] = [];

  let subtotal = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
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
    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: product.name,
          description: product.tagline,
          images: [product.image],
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
        },
      },
    });
  }

  const siteUrl = getSiteUrl();

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
