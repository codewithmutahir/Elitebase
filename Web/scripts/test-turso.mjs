import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

try {
  const ping = await client.execute("select 1 as ok");
  console.log("ping", ping.rows);

  const tables = await client.execute(
    "select name from sqlite_master where type = 'table' order by name"
  );
  console.log(
    "tables",
    tables.rows.map((r) => r.name)
  );
} catch (error) {
  console.error("FAIL", error.message);
  process.exit(1);
}
