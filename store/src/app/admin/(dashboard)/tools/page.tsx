import { AdminBadge } from "@/components/admin-badge";
import { stripePricing } from "@/lib/admin-tools";
import { getStripe } from "@/lib/stripe";

export default async function AdminToolsPage() {
  const stripeReady = Boolean(getStripe());

  return (
    <div>
      <h1 className="text-[1.65rem] font-semibold tracking-tight">
        Tools and Services
      </h1>
      <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
        Stripe checkout fees. No monthly charge.
      </p>

      <section id="stripe" className="mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold">Stripe</h2>
          <AdminBadge tone={stripeReady ? "ok" : "warn"}>
            {stripeReady ? "Configured" : "Keys missing"}
          </AdminBadge>
        </div>
        <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
          {stripePricing.headline} per domestic card.{" "}
          <a
            href="https://stripe.com/pricing"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[color:var(--admin-fg)] hover:underline"
          >
            Official pricing
          </a>
        </p>
        <div className="admin-table-wrap mt-3">
          <table>
            <thead>
              <tr>
                <th>Fee</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {stripePricing.rates.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td className="font-medium">{row.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
