import { describe, expect, it } from "vitest";
import { connectorProgressPct } from "./connectors";

describe("connectorProgressPct", () => {
  it("counts each of the 12 sections once", () => {
    expect(connectorProgressPct(["intro", "intro", "lab"])).toBe(17);
  });
  it("ignores unknown section keys", () => {
    expect(connectorProgressPct(["bogus"])).toBe(0);
  });
  it("reaches 100 when all sections are done", () => {
    expect(connectorProgressPct(["intro","architecture","parameters","security","endpoint","imports","provisioning","scheduling","troubleshooting","scenarios","lab","interview"])).toBe(100);
  });
});
