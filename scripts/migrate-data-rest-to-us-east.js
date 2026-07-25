/**
 * Copy Singapore public data → US East using REST (service role) + pg insert.
 */
const path = require("path");
const { Client } = require(path.join(__dirname, ".pg-tmp", "node_modules", "pg"));

const OLD_URL = process.env.OLD_SUPABASE_URL;
const OLD_SERVICE_KEY = process.env.OLD_SERVICE_ROLE_KEY;
const NEW_DIRECT_URL = process.env.NEW_DIRECT_URL;

if (!OLD_URL || !OLD_SERVICE_KEY || !NEW_DIRECT_URL) {
  console.error(
    "Set OLD_SUPABASE_URL, OLD_SERVICE_ROLE_KEY, and NEW_DIRECT_URL env vars."
  );
  process.exit(1);
}

const TABLE_ORDER = [
  "companies",
  "departments",
  "roles",
  "employees",
  "employee_pins",
  "kiosk_tablets",
  "attendance",
  "schedules",
  "employee_availability",
  "employee_documents",
  "employee_notes",
  "employee_milestones",
];

async function fetchAll(table) {
  const rows = [];
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const to = from + pageSize - 1;
    const res = await fetch(
      `${OLD_URL}/rest/v1/${table}?select=*&order=id.asc`,
      {
        headers: {
          apikey: OLD_SERVICE_KEY,
          Authorization: `Bearer ${OLD_SERVICE_KEY}`,
          Range: `${from}-${to}`,
          Prefer: "count=exact",
        },
      }
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${table}: ${res.status} ${text}`);
    }
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function getColumns(client, table) {
  const res = await client.query(
    `
    SELECT column_name, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `,
    [table]
  );
  return res.rows;
}

function normalizeValue(val, udt) {
  if (val == null) return null;
  if (udt === "vector") {
    if (Array.isArray(val)) return `[${val.join(",")}]`;
    if (typeof val === "string") return val;
    return String(val);
  }
  return val;
}

async function insertRows(client, table, columns, rows) {
  if (rows.length === 0) return 0;
  const colList = columns.map((c) => c.column_name).join(", ");
  let inserted = 0;
  const batchSize = 50;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = [];
    const placeholders = batch.map((row, rowIdx) => {
      const parts = columns.map((c, colIdx) => {
        const param = rowIdx * columns.length + colIdx + 1;
        values.push(normalizeValue(row[c.column_name], c.udt_name));
        return c.udt_name === "vector" ? `$${param}::vector` : `$${param}`;
      });
      return `(${parts.join(", ")})`;
    });

    const sql = `
      INSERT INTO public.${table} (${colList})
      VALUES ${placeholders.join(", ")}
      ON CONFLICT DO NOTHING
    `;
    const result = await client.query(sql, values);
    inserted += result.rowCount ?? 0;
  }
  return inserted;
}

async function main() {
  const newDb = new Client({
    connectionString: NEW_DIRECT_URL,
    ssl: { rejectUnauthorized: false },
  });
  await newDb.connect();
  console.log("connected to US East");

  await newDb.query("SET session_replication_role = replica");
  await newDb.query("BEGIN");

  try {
    for (const table of TABLE_ORDER) {
      process.stdout.write(`FETCH ${table} ... `);
      const rows = await fetchAll(table);
      if (rows == null) {
        console.log("missing on source, skip");
        continue;
      }
      console.log(`${rows.length} rows`);
      if (rows.length === 0) continue;

      const columns = await getColumns(newDb, table);
      const colNames = new Set(columns.map((c) => c.column_name));
      // Only columns present in both destination and first source row
      const usable = columns.filter((c) =>
        Object.prototype.hasOwnProperty.call(rows[0], c.column_name)
      );
      const missing = [...colNames].filter(
        (n) => !Object.prototype.hasOwnProperty.call(rows[0], n)
      );
      if (missing.length) {
        console.log(`  (dest-only cols left default: ${missing.join(", ")})`);
      }

      const n = await insertRows(newDb, table, usable, rows);
      console.log(`  inserted ${n}`);
    }
    await newDb.query("COMMIT");
  } catch (e) {
    await newDb.query("ROLLBACK");
    throw e;
  } finally {
    await newDb.query("SET session_replication_role = DEFAULT");
  }

  console.log("\nUS East counts:");
  for (const table of TABLE_ORDER) {
    const r = await newDb.query(`SELECT count(*)::int AS n FROM public.${table}`);
    console.log(`  ${table}: ${r.rows[0].n}`);
  }

  await newDb.end();
  console.log("\ndata migration complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
