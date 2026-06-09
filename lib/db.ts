import { neon } from "@neondatabase/serverless";

// Lazy singleton — safe if DATABASE_URL is absent (tracking silently no-ops)
let _sql: ReturnType<typeof neon> | null = null;

function getClient(): ReturnType<typeof neon> | null {
  if (!process.env.DATABASE_URL) return null;
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

type TemplateResult = Promise<Array<Record<string, unknown>>>;

/**
 * Tagged-template wrapper around the Neon client.
 * Returns an empty array if DATABASE_URL is not configured,
 * so tracking calls in API routes fail silently rather than crashing.
 */
export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): TemplateResult {
  const client = getClient();
  if (!client) return Promise.resolve([]);
  // neon() returns a tagged-template function — call it directly
  return (client as unknown as (s: TemplateStringsArray, ...v: unknown[]) => TemplateResult)(
    strings,
    ...values
  );
}
