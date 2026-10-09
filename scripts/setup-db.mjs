import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { products } from "../lib/catalog.ts";
if (!process.env.DATABASE_URL)
  throw new Error("Add DATABASE_URL to .env first.");
const sql = neon(process.env.DATABASE_URL);
for (const file of ["neon.sql", "laptop-configurations.sql", "mobile.sql"])
  for (const statement of readFileSync(
    new URL("../db/" + file, import.meta.url),
    "utf8",
  )
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean))
    await sql.query(statement);
for (const [position, p] of products.entries())
  await sql`INSERT INTO products(id,data,position) VALUES(${p.id},${JSON.stringify(p)}::jsonb,${position}) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,position=EXCLUDED.position`;
console.log(
  "NOVA schema ready. Four configurable laptops seeded; existing orders preserved.",
);
