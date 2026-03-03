// Date helpers used across planner/habit UI. Keeps formatting logic out of components.
import { addDays, endOfWeek, format, isWithinInterval, parseISO, startOfWeek } from 'date-fns';

type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WeekRange {
  start: Date;
  end: Date;
}

export const buildWeekRange = (weekStartsOn: WeekStart = 0): WeekRange => ({
  start: startOfWeek(new Date(), { weekStartsOn }),
  end: endOfWeek(new Date(), { weekStartsOn }),
});

export const formatWeekRangeLabel = (range: WeekRange): string => {
  const startLabel = format(range.start, 'MMM d');
  const endLabel = format(addDays(range.end, 0), 'MMM d');
  return `${startLabel} – ${endLabel}`;
};

export const todayIso = (): string => format(new Date(), 'yyyy-MM-dd');

export const isDateIsoWithinRange = (dateIso: string | null | undefined, range: WeekRange): boolean => {
  if (!dateIso) return false;
  try {
    const date = parseISO(dateIso);
    return isWithinInterval(date, range);
  } catch {
    return false;
  }
};
