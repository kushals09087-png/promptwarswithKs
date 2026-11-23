export type Interval = { start: string | Date; end: string | Date };

export function isValidInterval(slot: Interval): boolean {
  return new Date(slot.start).getTime() < new Date(slot.end).getTime();
}

// Half-open intervals: [start, end). Adjacent reservations do not overlap.
export function overlaps(a: Interval, b: Interval): boolean {
  return new Date(a.start).getTime() < new Date(b.end).getTime() &&
    new Date(b.start).getTime() < new Date(a.end).getTime();
}

export function findAvailableSlots(
  desired: Interval,
  existing: Interval[],
  durationMinutes: number,
  stepMinutes = 30
): Interval[] {
  const duration = durationMinutes * 60_000;
  const step = stepMinutes * 60_000;
  const start = new Date(desired.start).getTime();
  const end = new Date(desired.end).getTime();
  const result: Interval[] = [];

  for (let cursor = start; cursor + duration <= end; cursor += step) {
    const candidate = { start: new Date(cursor), end: new Date(cursor + duration) };
    if (!existing.some(item => overlaps(candidate, item))) result.push(candidate);
  }
  return result;
}
