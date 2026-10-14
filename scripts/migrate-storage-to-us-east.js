/**
 * Copy storage objects Singapore → US East and rewrite public URLs in DB.
 * Loads NEW_* from Web/.env.local; OLD_* from args/env or defaults for source project.
 */
const fs = require("fs");
const path = require("path");
const { Client } = require(path.join(__dirname, ".pg-tmp", "node_modules", "pg"));

function loadEnvLocal() {
  const p = path.join(__dirname, "..", "Web", ".env.local");
  const text = fs.readFileSync(p, "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

const local = loadEnvLocal();

const OLD_URL = process.env.OLD_SUPABASE_URL;
const OLD_SERVICE_KEY = process.env.OLD_SERVICE_ROLE_KEY;

const NEW_URL = local.NEXT_PUBLIC_SUPABASE_URL;
const NEW_SERVICE_KEY = local.SUPABASE_SERVICE_ROLE_KEY;
const NEW_DIRECT_URL = local.DIRECT_URL || local.SUPABASE_DATABASE_URL;

if (!OLD_URL || !OLD_SERVICE_KEY) {
  console.error(
    "Missing OLD_SUPABASE_URL / OLD_SERVICE_ROLE_KEY (set via env; never hardcode secrets)."
  );
  process.exit(1);
}

if (!NEW_URL || !NEW_SERVICE_KEY || !NEW_DIRECT_URL) {
  console.error("Missing NEW_URL / SUPABASE_SERVICE_ROLE_KEY / DIRECT_URL in .env.local");
  process.exit(1);
}

const newPayload = JSON.parse(
  Buffer.from(NEW_SERVICE_KEY.split(".")[1], "base64").toString()
);
if (newPayload.ref !== "bhblsgujkgxwxktpvkqd") {
  console.error("SUPABASE_SERVICE_ROLE_KEY ref is", newPayload.ref, "- expected bhblsgujkgxwxktpvkqd");
  process.exit(1);
}

async function listAll(bucket, prefix = "") {
  const res = await fetch(`${OLD_URL}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: {
      apikey: OLD_SERVICE_KEY,
      Authorization: `Bearer ${OLD_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefix, limit: 100 }),
  });
  const items = await res.json();
  if (!Array.isArray(items)) {
    throw new Error(`list ${bucket}/${prefix}: ${JSON.stringify(items)}`);
  }
  const files = [];
  for (const it of items) {
    const p = prefix ? `${prefix}/${it.name}` : it.name;
    if (it.id == null) {
      files.push(...(await listAll(bucket, p)));
    } else {
      files.push({
        path: p,
        size: it.metadata?.size,
        contentType: it.metadata?.mimetype || "application/octet-stream",
      });
    }
  }
  return files;
}

async function download(bucket, objectPath) {
  const url = `${OLD_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
  const res = await fetch(url);
  if (!res.ok) {
    // fallback authenticated download
    const authRes = await fetch(
      `${OLD_URL}/storage/v1/object/${bucket}/${objectPath}`,
      {
        headers: {
          apikey: OLD_SERVICE_KEY,
          Authorization: `Bearer ${OLD_SERVICE_KEY}`,
        },
      }
    );
    if (!authRes.ok) {
      throw new Error(`download failed ${bucket}/${objectPath}: ${authRes.status}`);
    }
    const buf = Buffer.from(await authRes.arrayBuffer());
    return {
      buf,
      contentType: authRes.headers.get("content-type") || "application/octet-stream",
    };
  }
  return {
    buf: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") || "application/octet-stream",
  };
}

async function upload(bucket, objectPath, buf, contentType) {
  const res = await fetch(
    `${NEW_URL}/storage/v1/object/${bucket}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: NEW_SERVICE_KEY,
        Authorization: `Bearer ${NEW_SERVICE_KEY}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: buf,
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`upload failed ${bucket}/${objectPath}: ${res.status} ${text}`);
  }
}

async function main() {
  const buckets = ["company-logos", "employee-documents"];
  const copied = [];

  for (const bucket of buckets) {
    console.log(`Listing ${bucket}...`);
    const files = await listAll(bucket);
    console.log(`  ${files.length} file(s)`);
    for (const f of files) {
      process.stdout.write(`  ${bucket}/${f.path} ... `);
      const { buf, contentType } = await download(bucket, f.path);
      await upload(bucket, f.path, buf, f.contentType || contentType);
      copied.push({ bucket, path: f.path });
      console.log(`OK (${buf.length} bytes)`);
    }
  }

  const client = new Client({
    connectionString: NEW_DIRECT_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const logoUpdate = await client.query(
    `
    UPDATE public.companies
    SET logo_url = replace(logo_url, $1, $2)
    WHERE logo_url LIKE $3
    RETURNING id, logo_url
  `,
    [OLD_URL, NEW_URL, `${OLD_URL}%`]
  );
  console.log(`Updated companies.logo_url: ${logoUpdate.rowCount}`);
  for (const row of logoUpdate.rows) {
    console.log(`  ${row.id} -> ${row.logo_url}`);
  }

  const docUpdate = await client.query(
    `
    UPDATE public.employee_documents
    SET file_url = replace(file_url, $1, $2)
    WHERE file_url LIKE $3
    RETURNING id, file_url
  `,
    [OLD_URL, NEW_URL, `${OLD_URL}%`]
  );
  console.log(`Updated employee_documents.file_url: ${docUpdate.rowCount}`);

  // verify new storage
  for (const bucket of buckets) {
    const res = await fetch(`${NEW_URL}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: {
        apikey: NEW_SERVICE_KEY,
        Authorization: `Bearer ${NEW_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefix: "", limit: 100 }),
    });
    const top = await res.json();
    console.log(`US East ${bucket} top-level entries:`, Array.isArray(top) ? top.length : top);
  }

  await client.end();
  console.log(`\nCopied ${copied.length} file(s). Storage migration complete.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
