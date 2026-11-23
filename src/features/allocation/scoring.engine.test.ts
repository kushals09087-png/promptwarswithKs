import { describe, expect, it } from "vitest";
import { rankCandidates, scoreCandidate } from "./scoring.engine";

describe("allocation scoring", () => {
  it("returns a bounded score", () => {
    const result = scoreCandidate({
      equipmentId: "eq-1", equipmentName: "GPU",
      daysUntilDeadline: 2, suitability: 100,
      timePreference: 90, recentApprovedBookings: 1
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("ranks better-fit candidates higher when other inputs match", () => {
    const ranked = rankCandidates([
      { equipmentId: "a", equipmentName: "A", daysUntilDeadline: 2, suitability: 40, timePreference: 80, recentApprovedBookings: 1 },
      { equipmentId: "b", equipmentName: "B", daysUntilDeadline: 2, suitability: 95, timePreference: 80, recentApprovedBookings: 1 }
    ]);
    expect(ranked[0]?.equipmentId).toBe("b");
  });
});
