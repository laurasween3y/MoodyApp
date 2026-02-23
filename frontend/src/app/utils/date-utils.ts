import { addDays, endOfWeek, format, isWithinInterval, parseISO, startOfWeek, type Day } from 'date-fns';

export interface WeekRange {
  start: Date;
  end: Date;
}

export const buildWeekRange = (weekStartsOn: Day = 0): WeekRange => ({
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
