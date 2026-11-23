import { describe, it, expect } from "vitest";
import { BookingSchema } from "./booking.schema";

describe("BookingSchema Validation", () => {
  const validBooking = {
    equipmentId: "550e8400-e29b-41d4-a716-446655440000",
    projectId: "550e8400-e29b-41d4-a716-446655440001",
    startTime: "2026-11-25T10:00:00.000Z",
    endTime: "2026-11-25T12:00:00.000Z"
  };

  it("validates compliant booking parameters", () => {
    const result = BookingSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it("rejects invalid equipment UUID", () => {
    const result = BookingSchema.safeParse({
      ...validBooking,
      equipmentId: "invalid-uuid-format"
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid project UUID", () => {
    const result = BookingSchema.safeParse({
      ...validBooking,
      projectId: "not-a-uuid"
    });
    expect(result.success).toBe(false);
  });

  it("rejects endTime occurring before startTime", () => {
    const result = BookingSchema.safeParse({
      ...validBooking,
      startTime: "2026-11-25T14:00:00.000Z",
      endTime: "2026-11-25T12:00:00.000Z"
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("End time must be after start time");
    }
  });

  it("rejects zero-duration booking where startTime equals endTime", () => {
    const result = BookingSchema.safeParse({
      ...validBooking,
      startTime: "2026-11-25T12:00:00.000Z",
      endTime: "2026-11-25T12:00:00.000Z"
    });
    expect(result.success).toBe(false);
  });
});
