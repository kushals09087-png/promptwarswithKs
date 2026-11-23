import { ALLOCATION_CONFIG } from "./allocation.config";

/**
 * Represents a student booking candidate evaluated for equipment allocation.
 */
export type AllocationCandidate = {
  equipmentId: string;
  equipmentName: string;
  daysUntilDeadline: number;
  suitability: number;       // 0..100, computed from verified specifications
  timePreference: number;    // 0..100
  recentApprovedBookings: number;
};

/**
 * Candidate enriched with explainable component scores and aggregate composite score.
 */
export type ScoredCandidate = AllocationCandidate & {
  deadlineScore: number;
  fairnessScore: number;
  score: number;
};

/**
 * Computes an explainable, deterministic multi-criteria allocation score for an equipment reservation.
 *
 * Scoring Formula:
 * - Deadline Urgency (35%): Linear decay over DEADLINE_HORIZON_DAYS (14 days). Urgency increases as deadline approaches.
 * - Technical Suitability (30%): Bounded match score (0-100) between project requirements and instrument specifications.
 * - Time Preference (20%): Proximity to preferred student slot.
 * - Historical Fairness (15%): Anti-gaming penalty deducting 20 points per recently approved booking to prevent resource hoarding.
 *
 * @param candidate - The allocation request candidate parameters.
 * @returns ScoredCandidate with individual metric breakdowns and final score bounded in [0, 100].
 */
export function scoreCandidate(candidate: AllocationCandidate): ScoredCandidate {
  const { DEADLINE_HORIZON_DAYS, RECENT_BOOKING_PENALTY_PER_UNIT, WEIGHTS, BOUNDS } = ALLOCATION_CONFIG;

  const deadlineScore = Math.max(BOUNDS.MIN, Math.min(BOUNDS.MAX,
    BOUNDS.MAX * (1 - Math.max(BOUNDS.MIN, candidate.daysUntilDeadline) / DEADLINE_HORIZON_DAYS)
  ));

  const fairnessScore = BOUNDS.MAX - Math.min(
    BOUNDS.MAX,
    Math.max(BOUNDS.MIN, candidate.recentApprovedBookings) * RECENT_BOOKING_PENALTY_PER_UNIT
  );

  const score =
    WEIGHTS.DEADLINE_URGENCY * deadlineScore +
    WEIGHTS.TECHNICAL_SUITABILITY * Math.max(BOUNDS.MIN, Math.min(BOUNDS.MAX, candidate.suitability)) +
    WEIGHTS.TIME_PREFERENCE * Math.max(BOUNDS.MIN, Math.min(BOUNDS.MAX, candidate.timePreference)) +
    WEIGHTS.HISTORICAL_FAIRNESS * fairnessScore;

  return {
    ...candidate,
    deadlineScore,
    fairnessScore,
    score: Math.round(score * 100) / 100
  };
}

/**
 * Evaluates and ranks a collection of candidate equipment allocations in descending priority order.
 *
 * @param candidates - List of candidates competing for equipment access.
 * @returns Sorted list with highest priority score first.
 */
export function rankCandidates(candidates: AllocationCandidate[]): ScoredCandidate[] {
  return candidates.map(scoreCandidate).sort((a, b) => b.score - a.score);
}
