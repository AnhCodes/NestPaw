type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 5_000;

function pruneIfNeeded(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size < MAX_BUCKETS) return;
  // Drop oldest windows if still oversized (best-effort under abuse).
  const overflow = buckets.size - Math.floor(MAX_BUCKETS / 2);
  let dropped = 0;
  for (const key of buckets.keys()) {
    buckets.delete(key);
    dropped += 1;
    if (dropped >= overflow) break;
  }
}

/**
 * In-memory fixed-window limiter. Fine for single-instance / Fluid Compute
 * warm instances; not a distributed lock. Still stops casual brute force.
 */
export function rateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  pruneIfNeeded(now);

  const existing = buckets.get(options.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return { ok: true };
  }

  if (existing.count >= options.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
