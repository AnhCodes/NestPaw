import { config } from "dotenv";
import { resolve } from "path";
import { defineConfig } from "drizzle-kit";

config({ path: resolve(process.cwd(), ".env.local") });
config();

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
