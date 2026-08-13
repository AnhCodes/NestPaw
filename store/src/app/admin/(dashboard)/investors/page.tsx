import { AddInvestorButton } from "@/components/add-investor-form";
import { FLAT_SHIPPING, formatPrice, products } from "@/lib/products";
import { getRevenueSummary } from "@/lib/orders";
import { listInvestors } from "@/lib/investors";
import type { Investor } from "@/lib/db/schema";

function formatCents(cents: number) {
  return formatPrice(cents / 100);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const catalogNotes: Record<string, { landed: string; contribution: string }> = {
  "shed-brush": { landed: "~$4.11", contribution: "Strong" },
  "snuffle-mat": { landed: "~$14", contribution: "Solid" },
  "puzzle-feeder": { landed: "~$9", contribution: "Strong" },
  "nail-trimmer": { landed: "~$11", contribution: "Solid" },
  "lick-mat": { landed: "Low $", contribution: "Entry / attach" },
};

export default async function AdminInvestorsPage() {
  const [summary, investorRows] = await Promise.all([
    getRevenueSummary(),
    listInvestors(),
  ]);
  const raisedCents = investorRows.reduce(
    (sum, investor) => sum + investor.amountCents,
    0,
  );
  return (
    <div>
      <h1 className="text-[1.65rem] font-semibold tracking-tight">Investors</h1>
      <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
        Private record of who put money in, plus the live store numbers behind
        the pitch.
      </p>

      <div className="admin-card admin-stats mt-8">
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            Raised
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCents(raisedCents)}
          </p>
        </div>
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            Investors
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {investorRows.length}
          </p>
        </div>
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            Paid orders
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {summary.orderCount}
          </p>
        </div>
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            Revenue
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCents(summary.revenueCents)}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Logged investors</h2>
            <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
              For your records. Not shown on the storefront.
            </p>
          </div>
          <AddInvestorButton />
        </div>
        <div className="admin-table-wrap mt-3">
          <table className="min-w-[720px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Notes</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {investorRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-[color:var(--admin-muted)]">
                    No investors logged yet.
                  </td>
                </tr>
              ) : (
                investorRows.map((investor) => (
                  <InvestorRow key={investor.id} investor={investor} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="admin-card p-6">
          <h2 className="text-sm font-semibold">The idea</h2>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--admin-muted)]">
            NestPaw sells a small set of calm, comfort, and grooming tools for
            dogs at home. Wholesale in, direct on shopnestpaw.com, fulfilled from
            a U.S. address. Not another pet aisle.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[color:var(--admin-muted)]">
            <li>Real home problems: shedding, foraging, fast eating, nail stress.</li>
            <li>Year-round tools people use and replace.</li>
            <li>Five SKUs so winners show up fast.</li>
          </ul>
        </section>

        <section className="admin-card p-6">
          <h2 className="text-sm font-semibold">How money works</h2>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--admin-muted)]">
            Buy below retail, sell branded, keep the margin after ads and
            shipping. {formatPrice(FLAT_SHIPPING)} under $40; free shipping over $40.
            Samples first, bulk only on what sells. Self-ship week one.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[color:var(--admin-muted)]">
            Demand is proven by paid orders, not a larger pitch deck.
          </p>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">How fulfillment works</h2>
        <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
          Orders do not sit in a spreadsheet. Paid checkouts land on a three-step
          board we run from a U.S. address — pack, label, ship.
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div className="admin-card p-5">
            <p className="text-xs font-semibold tracking-wide text-[color:var(--admin-subtle)] uppercase">
              1. To pack
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--admin-muted)]">
              A paid Stripe order appears here with items, address, and contact.
              We can fix name, phone, or ship-to before the box is sealed.
            </p>
          </div>
          <div className="admin-card p-5">
            <p className="text-xs font-semibold tracking-wide text-[color:var(--admin-subtle)] uppercase">
              2. Packed
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--admin-muted)]">
              Mark packed when the kit, treats card, and packing are in the box.
              The order waits here until a USPS label is on it.
            </p>
          </div>
          <div className="admin-card p-5">
            <p className="text-xs font-semibold tracking-wide text-[color:var(--admin-subtle)] uppercase">
              3. Shipped
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--admin-muted)]">
              Enter matching tracking twice. That emails the customer a USPS
              link. No 3PL in week one — we prove ship times ourselves, then
              scale the same pipeline.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Catalog</h2>
        <div className="admin-table-wrap mt-3">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Landed (plan)</th>
                <th>Contribution</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const note = catalogNotes[product.id];
                return (
                  <tr key={product.id}>
                    <td className="font-medium">{product.name}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td className="text-[color:var(--admin-muted)]">
                      {note?.landed ?? "—"}
                    </td>
                    <td className="text-[color:var(--admin-muted)]">
                      {note?.contribution ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-[color:var(--admin-subtle)]">
          Landed is product + inbound freight for planning. Contribution is after
          outbound shipping, Stripe, and a returns pad.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Vs Amazon and Chewy</h2>
        <div className="admin-table-wrap mt-3">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Amazon / Chewy</th>
                <th>NestPaw</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Assortment", "Everything for pets", "Five calm-home SKUs"],
                ["Discovery", "Search rank and noise", "Brand story + ads"],
                ["Customer", "Platform owns the relationship", "Orders and email on our stack"],
                ["Margins", "Fees + race to the bottom", "Wholesale → DTC room for ads"],
                ["Inventory", "Scale first", "Samples → winners only"],
              ].map(([label, them, us]) => (
                <tr key={label}>
                  <td className="font-medium">{label}</td>
                  <td className="text-[color:var(--admin-muted)]">{them}</td>
                  <td>{us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-card mt-8 p-6">
        <h2 className="text-sm font-semibold">How we prove it</h2>
        <ol className="mt-4 space-y-2 text-sm text-[color:var(--admin-muted)]">
          <li>1. Live store, checkout, inventory, and shipping email.</li>
          <li>2. Samples before bulk — QA and real ship times.</li>
          <li>3. Soft launch — conversion and CAC by SKU.</li>
          <li>4. Reorder winners. Drop losers.</li>
          <li>5. Scale ads only after first orders validate the message.</li>
        </ol>
        <p className="mt-5 text-sm leading-relaxed text-[color:var(--admin-fg)]">
          NestPaw does not need to beat Amazon at Amazon’s game. It needs
          profitable orders, owned customers, and the discipline to scale only
          what sells.
        </p>
      </section>
    </div>
  );
}

function InvestorRow({ investor }: { investor: Investor }) {
  const dateValue = toDateInputValue(new Date(investor.investedAt));
  const amountValue = (investor.amountCents / 100).toFixed(2);

  return (
    <tr>
      <td>
        <form
          id={`save-${investor.id}`}
          action={`/api/admin/investors/${investor.id}`}
          method="post"
        />
        <form
          id={`delete-${investor.id}`}
          action={`/api/admin/investors/${investor.id}`}
          method="post"
        >
          <input type="hidden" name="intent" value="delete" />
        </form>
        <input
          form={`save-${investor.id}`}
          name="name"
          required
          defaultValue={investor.name}
          className="admin-input !mt-0 min-w-[10rem]"
        />
      </td>
      <td>
        <input
          form={`save-${investor.id}`}
          type="number"
          name="amount"
          min={0}
          step="0.01"
          required
          defaultValue={amountValue}
          className="admin-input !mt-0 w-24"
        />
      </td>
      <td>
        <input
          form={`save-${investor.id}`}
          type="date"
          name="investedAt"
          required
          defaultValue={dateValue}
          className="admin-input !mt-0 w-[9.5rem]"
        />
      </td>
      <td>
        <input
          form={`save-${investor.id}`}
          name="notes"
          defaultValue={investor.notes ?? ""}
          placeholder="Optional"
          className="admin-input !mt-0 min-w-[8rem]"
        />
      </td>
      <td className="text-right">
        <div className="flex justify-end gap-2">
          <button form={`save-${investor.id}`} type="submit" className="btn-primary">
            Save
          </button>
          <button
            form={`delete-${investor.id}`}
            type="submit"
            className="rounded-md px-2 py-1.5 text-xs font-medium text-[color:var(--admin-danger-fg)] hover:underline"
          >
            Remove
          </button>
        </div>
      </td>
    </tr>
  );
}
