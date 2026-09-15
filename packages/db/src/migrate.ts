import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required");
}

const drizzleDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../drizzle");
const sql = postgres(url, { max: 1 });

await sql.unsafe(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  );
`);

const files = (await readdir(drizzleDir))
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  const applied = await sql<{ id: string }[]>`
    SELECT id FROM schema_migrations WHERE id = ${file}
  `;
  if (applied.length > 0) {
    continue;
  }
  const body = await readFile(path.join(drizzleDir, file), "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(body);
    await tx`INSERT INTO schema_migrations (id) VALUES (${file})`;
  });
  console.log(`applied ${file}`);
}

await sql.end();
console.log("migrations complete");
