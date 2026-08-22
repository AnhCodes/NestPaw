import { shippingEmailHtml } from "@/lib/email";
import { getSiteUrl } from "@/lib/site";

export default function ShippingEmailPreviewPage() {
  const html = shippingEmailHtml({
    greeting: "Hi Alex,",
    orderId: "np_order_preview",
    trackingNumber: "9400123456789012345678",
    trackLink:
      "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400123456789012345678",
    siteUrl: getSiteUrl(),
  });

  return (
    <div>
      <h1 className="text-[1.65rem] font-semibold tracking-tight">
        Shipping email
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-[color:var(--admin-muted)]">
        Preview of the customer email sent when an order is marked shipped with
        tracking. Sample data only — not a real order.
      </p>
      <div className="mt-8 overflow-hidden rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)]">
        <iframe
          title="Shipping email preview"
          srcDoc={html}
          className="h-[52rem] w-full bg-[#e9e3e0]"
        />
      </div>
    </div>
  );
}
