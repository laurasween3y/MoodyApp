import { endOfWeek, format, isSameWeek, startOfWeek } from 'date-fns';
import { Habit } from '../services/habit.service';
import { isDateIsoWithinRange, todayIso, WeekRange } from './date-utils';

type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface HabitDashboardView extends Habit {
  isDoneToday: boolean;
  remainingThisWeek?: number;
  dueToday: boolean;
}

export const formatIso = (d: Date): string => format(d, 'yyyy-MM-dd');

export const calculateStreak = (completions: string[]): number => {
  const completionSet = new Set(completions || []);
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const iso = formatIso(cursor);
    if (completionSet.has(iso)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

export const normalizeTarget = (value: number): number => {
  if (!value || value < 1) return 1;
  if (value > 14) return 14;
  return Math.round(value);
};

export const completionsThisWeek = (completions: string[], weekStartsOn: WeekStart = 1): number => {
  const start = startOfWeek(new Date(), { weekStartsOn });
  const end = endOfWeek(new Date(), { weekStartsOn });
  return (completions || []).filter((dateStr) => {
    const d = new Date(dateStr);
    return isSameWeek(d, new Date(), { weekStartsOn }) && d >= start && d <= end;
  }).length;
};

export const calculateWeeklyProgress = (habit: Habit, weekStartsOn: WeekStart = 1) => {
  const count = completionsThisWeek(habit.completions, weekStartsOn);
  return {
    count,
    target: habit.target_per_week,
    percent: Math.min(100, Math.round((count / habit.target_per_week) * 100)),
    met: count >= habit.target_per_week,
  };
};

export const isHabitMet = (habit: Habit, weekStartsOn: WeekStart = 1): boolean => {
  if (habit.frequency === 'daily') return habit.completions.includes(todayIso());
  return completionsThisWeek(habit.completions, weekStartsOn) >= habit.target_per_week;
};

export const decorateHabitForDashboard = (habit: Habit, range: WeekRange): HabitDashboardView => {
  const today = todayIso();
  const completions = habit.completions || [];
  const isDoneToday = completions.includes(today);
  let dueToday = false;
  let remainingThisWeek = undefined as number | undefined;

  if (habit.frequency === 'daily' || habit.frequency === 'custom') {
    dueToday = !isDoneToday;
  } else {
    const countThisWeek = completions.filter((d) => isDateIsoWithinRange(d, range)).length;
    remainingThisWeek = Math.max(habit.target_per_week - countThisWeek, 0);
    dueToday = remainingThisWeek > 0 && !isDoneToday;
  }

  return { ...habit, isDoneToday, remainingThisWeek, dueToday };
};
