import { describe, expect, it } from "vitest";
import { validateReadOnlySql } from "./sql-lab-progress";

describe("validateReadOnlySql", () => {
  it("allows SELECT statements and a trailing semicolon", () => {
    expect(validateReadOnlySql("SELECT username FROM users;")).toBeNull();
  });
  it("allows SELECT CTEs", () => {
    expect(validateReadOnlySql("WITH active AS (SELECT * FROM users) SELECT * FROM active")).toBeNull();
  });
  it("rejects empty input and non-SELECT statements", () => {
    expect(validateReadOnlySql(" ")).toContain("Enter a SQL query");
    expect(validateReadOnlySql("DELETE FROM users")).toContain("Only read-only");
  });
  it("rejects write statements hidden in a CTE", () => {
    expect(validateReadOnlySql("WITH gone AS (DELETE FROM users RETURNING *) SELECT * FROM gone")).toContain("Only read-only");
  });
  it("rejects multiple statements", () => {
    expect(validateReadOnlySql("SELECT * FROM users; SELECT * FROM accounts;")).toContain("one SQL statement");
  });
  it("does not treat keywords inside string literals or comments as commands", () => {
    expect(validateReadOnlySql("SELECT 'DROP TABLE users' AS note -- DELETE FROM users\nFROM users")).toBeNull();
  });
  it("rejects unfinished literals and block comments", () => {
    expect(validateReadOnlySql("SELECT 'unfinished")).toContain("unfinished quote");
    expect(validateReadOnlySql("SELECT * FROM users /* unfinished")).toContain("unfinished quote");
  });
});
