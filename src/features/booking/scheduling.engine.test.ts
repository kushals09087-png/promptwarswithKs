import { describe, expect, it } from "vitest";
import { overlaps, isValidInterval } from "./scheduling.engine";

describe("booking interval logic", () => {
  it("detects overlapping intervals", () => {
    expect(overlaps(
      { start: "2026-11-24T10:00:00Z", end: "2026-11-24T12:00:00Z" },
      { start: "2026-11-24T11:00:00Z", end: "2026-11-24T13:00:00Z" }
    )).toBe(true);
  });

  it("allows adjacent half-open intervals", () => {
    expect(overlaps(
      { start: "2026-11-24T10:00:00Z", end: "2026-11-24T11:00:00Z" },
      { start: "2026-11-24T11:00:00Z", end: "2026-11-24T12:00:00Z" }
    )).toBe(false);
  });

  it("rejects invalid intervals", () => {
    expect(isValidInterval({ start: "2026-11-24T12:00:00Z", end: "2026-11-24T10:00:00Z" })).toBe(false);
  });
});
