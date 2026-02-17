import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HabitCreate, HabitResponse, HabitToggle, HabitUpdate, HabitsService } from '../api';

export type Frequency = 'daily' | 'weekly' | 'custom';
export interface Habit {
  id: number;
  title: string;
  frequency: Frequency;
  target_per_week: number;
  completions: string[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class HabitService {
  constructor(private habitsApi: HabitsService) {}

  getHabits(): Observable<Habit[]> {
    return this.habitsApi.habitsGet().pipe(map((list: HabitResponse[]) => list.map((h) => this.normalizeHabit(h))));
  }

  createHabit(payload: HabitCreate): Observable<Habit> {
    return this.habitsApi.habitsPost(payload).pipe(map((h) => this.normalizeHabit(h)));
  }

  updateHabit(id: number, payload: HabitUpdate): Observable<Habit> {
    return this.habitsApi.habitsHabitIdPatch(id, payload).pipe(map((h) => this.normalizeHabit(h)));
  }

  deleteHabit(id: number): Observable<void> {
    return this.habitsApi.habitsHabitIdDelete(id);
  }

  toggleCompletion(id: number, dateIso: string): Observable<Habit> {
    const body: HabitToggle = { date: dateIso };
    return this.habitsApi.habitsHabitIdTogglePost(id, body).pipe(map((h) => this.normalizeHabit(h)));
  }

  setCompletion(id: number, dateIso: string): Observable<Habit> {
    return this.habitsApi.habitsHabitIdCompletionsDateStrPut(id, dateIso).pipe(map((h) => this.normalizeHabit(h)));
  }

  unsetCompletion(id: number, dateIso: string): Observable<Habit> {
    return this.habitsApi.habitsHabitIdCompletionsDateStrDelete(id, dateIso).pipe(map((h) => this.normalizeHabit(h)));
  }

  private normalizeHabit(habit: HabitResponse): Habit {
    if (habit.id === undefined) {
      throw new Error('Habit id is required');
    }
    return {
      id: habit.id,
      title: habit.title ?? '',
      frequency: (habit.frequency as Frequency) ?? 'daily',
      target_per_week: habit.target_per_week ?? 1,
      completions: (habit.completions ?? []).map((c) => c.slice(0, 10)),
      created_at: habit.created_at,
      updated_at: habit.updated_at,
    };
  }
}
