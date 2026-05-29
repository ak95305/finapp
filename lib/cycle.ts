import type { CyclePeriod } from "@/types/finance";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDay(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * Given a cycle start day (e.g. 5) and a reference date, returns the
 * current cycle period.
 *
 * Example: startDay=5, today=Jun 10 → start=Jun 5, end=Jul 4
 * Example: startDay=5, today=Jun 3  → start=May 5, end=Jun 4
 */
export function getCyclePeriod(startDay: number, refDate: Date = new Date()): CyclePeriod {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const day = refDate.getDate();

  let startYear = year;
  let startMonth = month;

  if (day < startDay) {
    // We're before the start day this month — cycle started last month
    startMonth = month - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear = year - 1;
    }
  }

  const start = new Date(startYear, startMonth, startDay);

  // End is one day before start of next cycle
  const nextCycleStart = new Date(
    startMonth === 11 ? startYear + 1 : startYear,
    startMonth === 11 ? 0 : startMonth + 1,
    startDay
  );
  const end = new Date(nextCycleStart.getTime() - 24 * 60 * 60 * 1000);

  return {
    start,
    end,
    cycleStart: toISODate(start),
    label: `${formatDay(start)} – ${formatDay(end)}`,
  };
}

export function getCycleForDate(startDay: number, date: Date): string {
  return getCyclePeriod(startDay, date).cycleStart;
}

export function isPastCycle(cycleStart: string, startDay: number): boolean {
  const current = getCyclePeriod(startDay).cycleStart;
  return cycleStart < current;
}
