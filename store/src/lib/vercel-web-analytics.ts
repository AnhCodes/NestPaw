type AnalyticsRow = {
  label: string;
  pageviews: number | null;
  visitors: number | null;
};

export type AdminWebAnalytics = {
  status: "ok" | "not-configured" | "no-data" | "error";
  reason?: string;
  windowLabel: string;
  pageviews: number | null;
  visitors: number | null;
  topPages: AnalyticsRow[];
  topDevices: AnalyticsRow[];
};

type ProjectRef = {
  projectId: string;
  teamId?: string;
};

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getFirstNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = toNumber(record[key]);
    if (value != null) return value;
  }
  return null;
}

function normalizeAggregateRows(data: unknown, labelKeys: string[]): AnalyticsRow[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      const label =
        labelKeys
          .map((key) => record[key])
          .find((value): value is string => typeof value === "string" && value.length > 0) ??
        "Unknown";

      return {
        label,
        pageviews: getFirstNumber(record, ["pageviews", "views", "value", "count"]),
        visitors: getFirstNumber(record, ["visitors", "uniqueVisitors"]),
      };
    })
    .filter((row): row is AnalyticsRow => Boolean(row));
}

async function resolveProjectRef(): Promise<ProjectRef | null> {
  const projectId =
    process.env.VERCEL_ANALYTICS_PROJECT_ID || process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID || process.env.VERCEL_ORG_ID;

  if (projectId) {
    return { projectId, teamId: teamId || undefined };
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const { readFile } = await import("fs/promises");
  const path = await import("path");

  const candidates = [
    path.join(process.cwd(), ".vercel", "project.json"),
    path.join(process.cwd(), "..", ".vercel", "project.json"),
  ];

  for (const candidate of candidates) {
    try {
      const raw = await readFile(candidate, "utf8");
      const parsed = JSON.parse(raw) as {
        projectId?: string;
        orgId?: string;
      };
      if (parsed.projectId) {
        return {
          projectId: parsed.projectId,
          teamId: parsed.orgId || undefined,
        };
      }
    } catch {
      // ignore missing local project metadata
    }
  }

  return null;
}

async function queryVercelAnalytics(
  endpoint: "count" | "aggregate",
  params: Record<string, string>,
) {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return null;

  const url = new URL(
    `https://api.vercel.com/v1/query/web-analytics/visits/${endpoint}`,
  );
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Vercel analytics request failed (${response.status})`);
  }

  return response.json();
}

export async function getAdminWebAnalytics(
  days = 7,
): Promise<AdminWebAnalytics> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    return {
      status: "not-configured",
      reason: "Set VERCEL_API_TOKEN to load live Vercel analytics in admin.",
      windowLabel: `Last ${days} days`,
      pageviews: null,
      visitors: null,
      topPages: [],
      topDevices: [],
    };
  }

  const projectRef = await resolveProjectRef();
  if (!projectRef) {
    return {
      status: "not-configured",
      reason:
        "Missing Vercel project identifiers. Set VERCEL_ANALYTICS_PROJECT_ID and VERCEL_ANALYTICS_TEAM_ID if needed.",
      windowLabel: `Last ${days} days`,
      pageviews: null,
      visitors: null,
      topPages: [],
      topDevices: [],
    };
  }

  const since = isoDaysAgo(days);
  const until = new Date().toISOString();
  const baseParams: Record<string, string> = {
    projectId: projectRef.projectId,
    since,
    until,
  };
  if (projectRef.teamId) {
    baseParams.teamId = projectRef.teamId;
  }

  try {
    const [countJson, pagesJson, devicesJson] = await Promise.all([
      queryVercelAnalytics("count", baseParams),
      queryVercelAnalytics("aggregate", {
        ...baseParams,
        by: "route",
        limit: "5",
      }),
      queryVercelAnalytics("aggregate", {
        ...baseParams,
        by: "deviceType",
        limit: "5",
      }),
    ]);

    const countData =
      countJson && typeof countJson === "object" && "data" in countJson
        ? (countJson as { data?: Record<string, unknown> }).data
        : null;

    const pageviews =
      countData && typeof countData === "object"
        ? getFirstNumber(countData, ["pageviews", "views", "count", "value"])
        : null;
    const visitors =
      countData && typeof countData === "object"
        ? getFirstNumber(countData, ["visitors", "uniqueVisitors"])
        : null;

    const topPages = normalizeAggregateRows(
      pagesJson && typeof pagesJson === "object" && "data" in pagesJson
        ? (pagesJson as { data?: unknown }).data
        : null,
      ["route", "requestPath"],
    );
    const topDevices = normalizeAggregateRows(
      devicesJson && typeof devicesJson === "object" && "data" in devicesJson
        ? (devicesJson as { data?: unknown }).data
        : null,
      ["deviceType"],
    );

    if ((pageviews ?? 0) === 0 && (visitors ?? 0) === 0 && topPages.length === 0) {
      return {
        status: "no-data",
        reason:
          "No analytics data yet. Make sure Web Analytics is enabled in Vercel and the site has production traffic.",
        windowLabel: `Last ${days} days`,
        pageviews,
        visitors,
        topPages,
        topDevices,
      };
    }

    return {
      status: "ok",
      windowLabel: `Last ${days} days`,
      pageviews,
      visitors,
      topPages,
      topDevices,
    };
  } catch (error) {
    return {
      status: "error",
      reason:
        error instanceof Error
          ? error.message
          : "Failed to load Vercel analytics.",
      windowLabel: `Last ${days} days`,
      pageviews: null,
      visitors: null,
      topPages: [],
      topDevices: [],
    };
  }
}
