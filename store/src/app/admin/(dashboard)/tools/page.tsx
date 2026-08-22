import { AdminBadge } from "@/components/admin-badge";
import {
  cursorPricing,
  higgsfieldPricing,
  stripePricing,
} from "@/lib/admin-tools";
import { getStripe } from "@/lib/stripe";

export default async function AdminToolsPage() {
  const stripeReady = Boolean(getStripe());

  return (
    <div>
      <h1 className="text-[1.65rem] font-semibold tracking-tight">
        Tools and Services
      </h1>
      <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
        Stripe for checkout. Higgsfield for ads. Cursor for the store.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <section id="stripe">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold">Stripe</h2>
            <AdminBadge tone={stripeReady ? "ok" : "warn"}>
              {stripeReady ? "Configured" : "Keys missing"}
            </AdminBadge>
          </div>
          <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
            {stripePricing.headline} per domestic card. No monthly fee.{" "}
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

        <section id="higgsfield">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold">Higgsfield</h2>
            <AdminBadge tone="ok">Plus</AdminBadge>
          </div>
          <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
            {higgsfieldPricing.usedFor}. Log credit packs in inventory.{" "}
            <a
              href={higgsfieldPricing.site}
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
                  <th>Plan</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {higgsfieldPricing.plans.map((row) => (
                  <tr key={row.name}>
                    <td>
                      <p>{row.name}</p>
                      <p className="text-xs text-[color:var(--admin-subtle)]">
                        {row.note}
                      </p>
                    </td>
                    <td className="font-medium">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-table-wrap mt-3">
            <table>
              <thead>
                <tr>
                  <th>Credit pack</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {higgsfieldPricing.packs.map((row) => (
                  <tr key={row.name}>
                    <td>
                      <p>{row.name}</p>
                      <p className="text-xs text-[color:var(--admin-subtle)]">
                        {row.note}
                      </p>
                    </td>
                    <td className="font-medium">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="cursor">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold">Cursor</h2>
            <AdminBadge tone="ok">Pro</AdminBadge>
          </div>
          <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
            {cursorPricing.usedFor}. Log the monthly plan in inventory.{" "}
            <a
              href={cursorPricing.site}
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
                  <th>Plan</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {cursorPricing.plans.map((row) => (
                  <tr key={row.name}>
                    <td>
                      <p>{row.name}</p>
                      <p className="text-xs text-[color:var(--admin-subtle)]">
                        {row.note}
                      </p>
                    </td>
                    <td className="font-medium">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section id="shipping-email" className="mt-10">
        <h2 className="text-sm font-semibold">Shipping email</h2>
        <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
          Sent automatically when you mark an order shipped with tracking.
        </p>
        <a
          href="/admin/tools/shipping-email"
          className="mt-3 inline-block text-sm font-medium text-[color:var(--admin-accent)] hover:underline"
        >
          Preview template
        </a>
      </section>
    </div>
  );
}
