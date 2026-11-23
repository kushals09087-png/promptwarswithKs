/**
 * Typed configuration constants for the explainable allocation scoring engine.
 * Decouples algorithmic weights, penalty factors, and horizon constants from execution.
 */
export const ALLOCATION_CONFIG = {
  /** Maximum horizon in days for deadline urgency weighting (beyond this, urgency = 0) */
  DEADLINE_HORIZON_DAYS: 14,
  /** Penalty points deducted per approved booking in the recent window (ensures fair campus sharing) */
  RECENT_BOOKING_PENALTY_PER_UNIT: 20,
  /** Component weights summing strictly to 1.0 (35% deadline urgency, 30% technical suitability, 20% time preference, 15% historical fairness) */
  WEIGHTS: {
    DEADLINE_URGENCY: 0.35,
    TECHNICAL_SUITABILITY: 0.30,
    TIME_PREFERENCE: 0.20,
    HISTORICAL_FAIRNESS: 0.15
  },
  /** Minimum and maximum bounds for individual scores */
  BOUNDS: {
    MIN: 0,
    MAX: 100
  }
} as const;

export type AllocationConfig = typeof ALLOCATION_CONFIG;
