import { addDays } from 'date-fns';
import { Habit } from '../services/habit.service';
import { buildWeekRange, todayIso } from './date-utils';
import {
  calculateStreak,
  calculateWeeklyProgress,
  decorateHabitForDashboard,
  isHabitMet,
  normalizeTarget,
} from './habit-utils';

const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 1,
  title: 'Test',
  frequency: 'daily',
  target_per_week: 3,
  completions: [],
  awarded: [],
  ...overrides,
});

describe('habit-utils', () => {
  it('normalizeTarget clamps values', () => {
    expect(normalizeTarget(0)).toBe(1);
    expect(normalizeTarget(-4)).toBe(1);
    expect(normalizeTarget(20)).toBe(14);
    expect(normalizeTarget(2.7)).toBe(3);
  });

  it('calculateStreak counts consecutive days from today', () => {
    const today = new Date();
    const yesterday = addDays(today, -1);
    const completions = [todayIso(), addDays(yesterday, 0).toISOString().slice(0, 10)];
    expect(calculateStreak(completions)).toBe(2);
  });

  it('calculateStreak resets on gap day', () => {
    const today = new Date();
    const twoDaysAgo = addDays(today, -2);
    const completions = [todayIso(), twoDaysAgo.toISOString().slice(0, 10)];
    expect(calculateStreak(completions)).toBe(1);
  });

  it('calculateStreak initializes with first entry', () => {
    const completions = [todayIso()];
    expect(calculateStreak(completions)).toBe(1);
  });

  it('calculateWeeklyProgress returns percent and met status', () => {
    const habit = makeHabit({
      target_per_week: 2,
      completions: [todayIso()],
    });
    const result = calculateWeeklyProgress(habit);
    expect(result.count).toBe(1);
    expect(result.target).toBe(2);
    expect(result.percent).toBe(50);
    expect(result.met).toBeFalse();
  });

  it('isHabitMet returns true when daily completion exists', () => {
    const habit = makeHabit({
      frequency: 'daily',
      completions: [todayIso()],
    });
    expect(isHabitMet(habit)).toBeTrue();
  });

  it('decorateHabitForDashboard sets dueToday and remaining', () => {
    const range = buildWeekRange(1);
    const habit = makeHabit({
      frequency: 'weekly',
      target_per_week: 1,
      completions: [todayIso()],
    });
    const decorated = decorateHabitForDashboard(habit, range);
    expect(decorated.isDoneToday).toBeTrue();
    expect(decorated.remainingThisWeek).toBe(0);
    expect(decorated.dueToday).toBeFalse();
  });
});
