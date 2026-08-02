"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/products";

export type PurchaseLogItemView = {
  id: string;
  inventoryItemId: string;
  name: string;
  quantity: number;
  lineCostCents: number;
  sectionLabel: string;
};

export type PurchaseLogView = {
  id: string;
  vendor: string;
  totalCostCents: number;
  notes: string | null;
  createdAt: string;
  items: PurchaseLogItemView[];
};

const vendors = ["All", "Alibaba", "Amazon", "Print shop", "Other"] as const;
const sorts = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "amount-desc", label: "Highest amount" },
  { id: "amount-asc", label: "Lowest amount" },
] as const;
const datePresets = [
  { id: "all", label: "All time" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "month", label: "This month" },
  { id: "custom", label: "Custom range" },
] as const;

type SortId = (typeof sorts)[number]["id"];
type DatePresetId = (typeof datePresets)[number]["id"];

function formatPurchaseDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
}

function endOfLocalDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
}

function rangeForPreset(preset: DatePresetId) {
  if (preset === "all" || preset === "custom") {
    return { from: "", to: "" };
  }

  const now = new Date();
  const to = toDateInputValue(now);

  if (preset === "month") {
    return {
      from: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
      to,
    };
  }

  const days = preset === "7d" ? 7 : 30;
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - (days - 1));
  return { from: toDateInputValue(fromDate), to };
}

function PurchaseCard({ purchase }: { purchase: PurchaseLogView }) {
  return (
    <article className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-[color:var(--admin-fg)]">{purchase.vendor}</p>
          <p className="text-xs text-[color:var(--admin-subtle)]">
            {formatPurchaseDate(purchase.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-[color:var(--admin-fg)]">
            {formatPrice(purchase.totalCostCents / 100)}
          </p>
          <Link
            href={`/admin/inventory/purchases/${purchase.id}`}
            className="border border-[color:var(--admin-border)] px-2.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[color:var(--admin-fg)]"
          >
            Edit
          </Link>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {purchase.items.map((item) => (
          <span
            key={item.id}
            className="border border-[color:var(--admin-border)] px-2 py-1 text-xs text-[color:var(--admin-muted)]"
          >
            {item.name}
            {` x${item.quantity}`}
            {item.lineCostCents
              ? ` · ${formatPrice(item.lineCostCents / 100)}`
              : ""}
          </span>
        ))}
      </div>
      {purchase.notes ? (
        <p className="mt-4 text-sm text-[color:var(--admin-muted)]">{purchase.notes}</p>
      ) : null}
    </article>
  );
}

export function PurchaseLogsSection({
  purchases,
  sectionLabels,
}: {
  purchases: PurchaseLogView[];
  sectionLabels: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [vendor, setVendor] = useState<(typeof vendors)[number]>("All");
  const [section, setSection] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortId>("newest");
  const [datePreset, setDatePreset] = useState<DatePresetId>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const recent = purchases.slice(0, 8);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromTime = dateFrom ? startOfLocalDay(dateFrom) : null;
    const toTime = dateTo ? endOfLocalDay(dateTo) : null;

    const next = purchases.filter((purchase) => {
      if (vendor !== "All" && purchase.vendor !== vendor) return false;
      if (
        section !== "All" &&
        !purchase.items.some((item) => item.sectionLabel === section)
      ) {
        return false;
      }

      const createdAt = new Date(purchase.createdAt).getTime();
      if (fromTime != null && createdAt < fromTime) return false;
      if (toTime != null && createdAt > toTime) return false;

      if (!q) return true;
      const haystack = [
        purchase.vendor,
        purchase.notes ?? "",
        ...purchase.items.map((item) => `${item.name} ${item.inventoryItemId}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    next.sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sort === "amount-desc") return b.totalCostCents - a.totalCostCents;
      if (sort === "amount-asc") return a.totalCostCents - b.totalCostCents;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return next;
  }, [purchases, vendor, section, query, sort, dateFrom, dateTo]);

  const filteredTotal = filtered.reduce(
    (sum, purchase) => sum + purchase.totalCostCents,
    0,
  );

  return (
    <>
      <section className="mt-8 border border-[color:var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
            aria-expanded={expanded}
          >
            <span className="mt-1 text-sm text-[color:var(--admin-subtle)]">
              {expanded ? "▾" : "▸"}
            </span>
            <span>
              <span className="block font-display text-2xl font-semibold text-[color:var(--admin-fg)]">
                Recent purchase logs
              </span>
              <span className="mt-1 block text-xs uppercase tracking-[0.12em] text-[color:var(--admin-subtle)]">
                {purchases.length} total · {recent.length} recent
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="border border-[color:var(--admin-border)] bg-[var(--admin-surface-soft)] px-3 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[color:var(--admin-fg)]"
          >
            View all logs
          </button>
        </div>
        {expanded ? (
          <div className="space-y-4 border-t border-[color:var(--admin-border)] px-5 py-4">
            {recent.length === 0 ? (
              <div className="border border-dashed border-[color:var(--admin-border)] p-5 text-sm text-[color:var(--admin-muted)]">
                No purchase logs yet.
              </div>
            ) : (
              recent.map((purchase) => (
                <PurchaseCard key={purchase.id} purchase={purchase} />
              ))
            )}
          </div>
        ) : null}
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close purchase logs"
            className="absolute inset-0 bg-black/45"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-full max-w-xl flex-col border-l border-[color:var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--admin-border)] px-5 py-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[color:var(--admin-fg)]">
                  All purchase logs
                </h2>
                <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
                  {filtered.length} shown · {formatPrice(filteredTotal / 100)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="border border-[color:var(--admin-border)] px-3 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] transition hover:text-[color:var(--admin-fg)]"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 border-b border-[color:var(--admin-border)] px-5 py-4">
              <label className="block text-sm text-[color:var(--admin-fg)]">
                Search
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Vendor, notes, item name..."
                  className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none placeholder:text-[color:var(--admin-subtle)] focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Date range
                  <select
                    value={datePreset}
                    onChange={(e) => {
                      const next = e.target.value as DatePresetId;
                      setDatePreset(next);
                      if (next !== "custom") {
                        const range = rangeForPreset(next);
                        setDateFrom(range.from);
                        setDateTo(range.to);
                      }
                    }}
                    className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                  >
                    {datePresets.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm text-[color:var(--admin-fg)]">
                    From
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDatePreset("custom");
                        setDateFrom(e.target.value);
                      }}
                      className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                    />
                  </label>
                  <label className="block text-sm text-[color:var(--admin-fg)]">
                    To
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDatePreset("custom");
                        setDateTo(e.target.value);
                      }}
                      className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                    />
                  </label>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Vendor
                  <select
                    value={vendor}
                    onChange={(e) =>
                      setVendor(e.target.value as (typeof vendors)[number])
                    }
                    className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                  >
                    {vendors.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Category
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                  >
                    <option value="All">All</option>
                    {sectionLabels.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Sort
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortId)}
                    className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                  >
                    {sorts.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {filtered.length === 0 ? (
                <div className="border border-dashed border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5 text-sm text-[color:var(--admin-muted)]">
                  No purchase logs match these filters.
                </div>
              ) : (
                filtered.map((purchase) => (
                  <PurchaseCard key={purchase.id} purchase={purchase} />
                ))
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
