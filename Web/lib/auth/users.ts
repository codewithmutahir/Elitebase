import { createClient } from "@libsql/client";

export async function getAuthUserEmailsByIds(
  userIds: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const result = new Map<string, string>();

  if (unique.length === 0) return result;

  const url = process.env.TURSO_DATABASE_URL?.trim();
  if (!url) return result;

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
  });

  const chunkSize = 50;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => "?").join(",");

    try {
      const query = await client.execute({
        sql: `SELECT id, email FROM user WHERE id IN (${placeholders})`,
        args: chunk,
      });

      for (const row of query.rows) {
        const id = String(row.id);
        const email = row.email != null ? String(row.email) : "";
        if (email) result.set(id, email);
      }
    } catch (error) {
      console.error("getAuthUserEmailsByIds failed:", error);
    }
  }

  return result;
}
