export type AllocationCandidate = {
  equipmentId: string;
  equipmentName: string;
  daysUntilDeadline: number;
  suitability: number;       // 0..100, computed from verified specifications
  timePreference: number;    // 0..100
  recentApprovedBookings: number;
};

export type ScoredCandidate = AllocationCandidate & {
  deadlineScore: number;
  fairnessScore: number;
  score: number;
};

export function scoreCandidate(candidate: AllocationCandidate): ScoredCandidate {
  const deadlineScore = Math.max(0, Math.min(100,
    100 * (1 - Math.max(0, candidate.daysUntilDeadline) / 14)
  ));
  const fairnessScore = 100 - Math.min(100, Math.max(0, candidate.recentApprovedBookings) * 20);
  const score =
    0.35 * deadlineScore +
    0.30 * Math.max(0, Math.min(100, candidate.suitability)) +
    0.20 * Math.max(0, Math.min(100, candidate.timePreference)) +
    0.15 * fairnessScore;

  return { ...candidate, deadlineScore, fairnessScore, score: Math.round(score * 100) / 100 };
}

export function rankCandidates(candidates: AllocationCandidate[]): ScoredCandidate[] {
  return candidates.map(scoreCandidate).sort((a, b) => b.score - a.score);
}
