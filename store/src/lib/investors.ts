import { desc, eq, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { investors, type Investor } from "@/lib/db/schema";
import { newId } from "@/lib/inventory";

export type InvestorInput = {
  name: string;
  amountCents: number;
  notes?: string | null;
  investedAt?: Date;
};

let investorsTableReady: Promise<void> | null = null;

async function ensureInvestorsTable() {
  if (!investorsTableReady) {
    investorsTableReady = (async () => {
      const db = getDb();
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "investors" (
          "id" text PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "amount_cents" integer NOT NULL,
          "notes" text,
          "invested_at" timestamp with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        )
      `);
    })().catch((err) => {
      investorsTableReady = null;
      throw err;
    });
  }
  await investorsTableReady;
}

function parseInvestorInput(input: InvestorInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  if (!Number.isInteger(input.amountCents) || input.amountCents < 0) {
    throw new Error("Amount must be a valid dollar amount");
  }
  const notes = input.notes?.trim() || null;
  const investedAt = input.investedAt ?? new Date();
  if (Number.isNaN(investedAt.getTime())) {
    throw new Error("Invalid investment date");
  }
  return { name, amountCents: input.amountCents, notes, investedAt };
}

export async function listInvestors(): Promise<Investor[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    await ensureInvestorsTable();
    const db = getDb();
    return await db.select().from(investors).orderBy(desc(investors.investedAt));
  } catch (err) {
    console.error("[nestpaw][investors] listInvestors failed", err);
    return [];
  }
}

export async function createInvestor(input: InvestorInput) {
  const parsed = parseInvestorInput(input);
  await ensureInvestorsTable();
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .insert(investors)
    .values({
      id: newId("inv"),
      name: parsed.name,
      amountCents: parsed.amountCents,
      notes: parsed.notes,
      investedAt: parsed.investedAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return row;
}

export async function updateInvestor(id: string, input: InvestorInput) {
  const parsed = parseInvestorInput(input);
  await ensureInvestorsTable();
  const db = getDb();
  const [row] = await db
    .update(investors)
    .set({
      name: parsed.name,
      amountCents: parsed.amountCents,
      notes: parsed.notes,
      investedAt: parsed.investedAt,
      updatedAt: new Date(),
    })
    .where(eq(investors.id, id))
    .returning();
  if (!row) throw new Error("Investor not found");
  return row;
}

export async function deleteInvestor(id: string) {
  await ensureInvestorsTable();
  const db = getDb();
  const [row] = await db
    .delete(investors)
    .where(eq(investors.id, id))
    .returning({ id: investors.id });
  if (!row) throw new Error("Investor not found");
}
