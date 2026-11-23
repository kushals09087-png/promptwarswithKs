import { describe, expect, it } from "vitest";
import { overlaps, isValidInterval, findAvailableSlots } from "./scheduling.engine";

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

  it("rejects invalid intervals where start is after end", () => {
    expect(isValidInterval({ start: "2026-11-24T12:00:00Z", end: "2026-11-24T10:00:00Z" })).toBe(false);
  });

  it("rejects zero-duration intervals", () => {
    expect(isValidInterval({ start: "2026-11-24T12:00:00Z", end: "2026-11-24T12:00:00Z" })).toBe(false);
  });

  it("accepts strictly valid intervals", () => {
    expect(isValidInterval({ start: "2026-11-24T09:00:00Z", end: "2026-11-24T10:00:00Z" })).toBe(true);
  });
});

describe("findAvailableSlots intelligent scheduling", () => {
  const desired = {
    start: "2026-11-24T09:00:00.000Z",
    end: "2026-11-24T13:00:00.000Z" // 4 hours window = 240 mins
  };

  it("finds all slots when no existing reservations exist", () => {
    // 60-min slots with 60-min step in 4-hour window: 9-10, 10-11, 11-12, 12-13 => 4 slots
    const slots = findAvailableSlots(desired, [], 60, 60);
    expect(slots).toHaveLength(4);
    expect(new Date(slots[0].start).toISOString()).toBe("2026-11-24T09:00:00.000Z");
    expect(new Date(slots[3].end).toISOString()).toBe("2026-11-24T13:00:00.000Z");
  });

  it("omits slots that collide with existing bookings", () => {
    const existing = [
      { start: "2026-11-24T10:00:00.000Z", end: "2026-11-24T11:00:00.000Z" }
    ];
    // 60-min slots with 60-min step:
    // 9-10: free
    // 10-11: collides with existing
    // 11-12: free
    // 12-13: free
    const slots = findAvailableSlots(desired, existing, 60, 60);
    expect(slots).toHaveLength(3);
    const starts = slots.map(s => new Date(s.start).toISOString());
    expect(starts).not.toContain("2026-11-24T10:00:00.000Z");
    expect(starts).toContain("2026-11-24T09:00:00.000Z");
    expect(starts).toContain("2026-11-24T11:00:00.000Z");
    expect(starts).toContain("2026-11-24T12:00:00.000Z");
  });

  it("handles 30-minute granularity step", () => {
    // 60-min slots with 30-min step
    const shortWindow = {
      start: "2026-11-24T09:00:00.000Z",
      end: "2026-11-24T11:00:00.000Z" // 2 hours
    };
    // Slots possible: 9:00-10:00, 9:30-10:30, 10:00-11:00 => 3 slots
    const slots = findAvailableSlots(shortWindow, [], 60, 30);
    expect(slots).toHaveLength(3);
  });

  it("returns empty array when entire window is booked", () => {
    const fullyBooked = [
      { start: "2026-11-24T08:00:00.000Z", end: "2026-11-24T14:00:00.000Z" }
    ];
    const slots = findAvailableSlots(desired, fullyBooked, 60, 30);
    expect(slots).toHaveLength(0);
  });

  it("returns empty array when duration exceeds desired window", () => {
    const slots = findAvailableSlots(desired, [], 300, 30); // 5 hours requested in 4 hour window
    expect(slots).toHaveLength(0);
  });
});
