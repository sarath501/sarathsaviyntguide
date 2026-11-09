/**
 * Client-side SQL guard for the isolated sql.js practice database.
 * This is a learning sandbox, not a security boundary for production data.
 */
export function validateReadOnlySql(input: string): string | null {
  const sql = input.trim();
  if (!sql) return "Enter a SQL query before running it.";

  let code = "";
  let state: "normal" | "single" | "double" | "backtick" | "bracket" | "line" | "block" = "normal";
  let semicolons = 0;
  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i]!;
    const next = sql[i + 1] ?? "";
    if (state === "normal") {
      if (ch === "'" ) { state = "single"; code += " "; }
      else if (ch === '"') { state = "double"; code += " "; }
      else if (ch === "`") { state = "backtick"; code += " "; }
      else if (ch === "[") { state = "bracket"; code += " "; }
      else if (ch === "-" && next === "-") { state = "line"; code += "  "; i += 1; }
      else if (ch === "/" && next === "*") { state = "block"; code += "  "; i += 1; }
      else { if (ch === ";") semicolons += 1; code += ch; }
    } else if (state === "single" || state === "double" || state === "backtick") {
      const end = state === "single" ? "'" : state === "double" ? '"' : "`";
      if (ch === end && next === end) { i += 1; }
      else if (ch === end) state = "normal";
    } else if (state === "bracket") {
      if (ch === "]") state = "normal";
    } else if (state === "line") {
      if (ch === "\n") { state = "normal"; code += "\n"; }
    } else if (state === "block" && ch === "*" && next === "/") {
      state = "normal"; i += 1; code += " ";
    }
  }
  if (state === "single" || state === "double" || state === "backtick" || state === "bracket" || state === "block") {
    return "Your query contains an unfinished quote, identifier or comment.";
  }
  if (semicolons > 1 || (semicolons === 1 && !/;\s*$/.test(sql))) {
    return "Run one SQL statement at a time.";
  }
  const normalized = code.replace(/;\s*$/, "").trim();
  if (!/^(SELECT|WITH)\b/i.test(normalized)) {
    return "Only read-only SELECT queries and SELECT-based CTEs are allowed.";
  }
  const blocked = /\b(INSERT|UPDATE|DELETE|REPLACE|UPSERT|DROP|ALTER|CREATE|TRUNCATE|ATTACH|DETACH|PRAGMA|VACUUM|REINDEX|ANALYZE|GRANT|REVOKE|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)\b/i;
  if (blocked.test(normalized)) return "Only read-only SELECT queries are allowed in this practice sandbox.";
  return null;
}

export function readStoredStringArray(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function readStoredQueries(key: string): { name: string; sql: string; savedAt: string }[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is { name: string; sql: string; savedAt: string } =>
      !!item && typeof item.name === "string" && typeof item.sql === "string" && typeof item.savedAt === "string"
    ).slice(0, 25);
  } catch {
    return [];
  }
}
