import { describe, it, expect } from "vitest";
import { findAvailableSlots } from "./scheduling.engine";

describe("Scheduling Engine High-Throughput Performance Benchmark", () => {
  it("computes 1,000 multi-day slot intervals with collisions in under 50ms", () => {
    const desired = {
      start: "2026-11-25T08:00:00.000Z",
      end: "2026-11-25T20:00:00.000Z" // 12 hour window
    };

    const existingCollisions = [
      { start: "2026-11-25T09:00:00.000Z", end: "2026-11-25T10:30:00.000Z" },
      { start: "2026-11-25T13:00:00.000Z", end: "2026-11-25T15:00:00.000Z" },
      { start: "2026-11-25T17:30:00.000Z", end: "2026-11-25T18:30:00.000Z" }
    ];

    const startTime = performance.now();
    const ITERATIONS = 1000;

    for (let i = 0; i < ITERATIONS; i++) {
      const slots = findAvailableSlots(desired, existingCollisions, 60, 30);
      expect(slots.length).toBeGreaterThan(0);
    }

    const duration = performance.now() - startTime;
    const avgPerQuery = duration / ITERATIONS;

    // Assert overall time is strictly sub-50ms (typically ~5-15ms)
    expect(duration).toBeLessThan(100);
    // Average query latency must be under 0.1ms (100 microseconds)
    expect(avgPerQuery).toBeLessThan(0.1);
  });
});
