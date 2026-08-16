"use client";

import type { SpendSlice } from "@/lib/admin-spend";

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function slicePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polar(cx, cy, r, startAngle);
  const end = polar(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

const DEFAULT_SIZE = 160;

export function SpendPieChart({
  slices,
  size = DEFAULT_SIZE,
}: {
  slices: SpendSlice[];
  size?: number;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.cents, 0);
  const visible = slices.filter((slice) => slice.cents > 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  if (total <= 0 || visible.length === 0) {
    return (
      <p className="text-sm text-[color:var(--admin-muted)]">
        No spend logged yet.
      </p>
    );
  }

  let angle = 0;
  const arcs = visible.map((slice) => {
    const startAngle = angle;
    const sweep = (slice.cents / total) * 360;
    angle += sweep;
    return { ...slice, startAngle, endAngle: angle };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        style={{ width: size, height: size }}
        role="img"
        aria-label="Spend by category"
      >
        {visible.length === 1 ? (
          <circle cx={cx} cy={cy} r={r} fill={visible[0].color} />
        ) : (
          arcs.map((slice) => (
            <path
              key={slice.id}
              d={slicePath(cx, cy, r, slice.startAngle, slice.endAngle)}
              fill={slice.color}
            >
              <title>
                {slice.label}: {formatCents(slice.cents)}
              </title>
            </path>
          ))
        )}
      </svg>
      <ul className="min-w-0 flex-1 space-y-2.5">
        {visible.map((slice) => {
          const pct = Math.round((slice.cents / total) * 100);
          return (
            <li
              key={slice.id}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: slice.color }}
                  aria-hidden
                />
                <span className="truncate">{slice.label}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {formatCents(slice.cents)}
                <span className="ml-2 text-xs font-normal text-[color:var(--admin-subtle)]">
                  {pct}%
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
