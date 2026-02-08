import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HabitCreate, HabitResponse, HabitToggle, HabitUpdate, HabitsService } from '../api';

export type Frequency = HabitCreate['frequency'];
export type Habit = HabitResponse;

@Injectable({ providedIn: 'root' })
export class HabitService {
  constructor(private habitsApi: HabitsService) {}

  getHabits(): Observable<HabitResponse[]> {
    return this.habitsApi.habitsGet().pipe(
      map((list: HabitResponse[]) => list.map((h: HabitResponse) => this.normalizeHabit(h)))
    );
  }

  createHabit(payload: HabitCreate): Observable<HabitResponse> {
    return this.habitsApi.habitsPost(payload).pipe(map((h: HabitResponse) => this.normalizeHabit(h)));
  }

  updateHabit(id: number, payload: HabitUpdate): Observable<HabitResponse> {
    return this.habitsApi.habitsHabitIdPatch(id, payload).pipe(map((h: HabitResponse) => this.normalizeHabit(h)));
  }

  deleteHabit(id: number): Observable<void> {
    return this.habitsApi.habitsHabitIdDelete(id);
  }

  toggleCompletion(id: number, dateIso: string): Observable<HabitResponse> {
    const body: HabitToggle = { date: dateIso };
    return this.habitsApi.habitsHabitIdTogglePost(id, body).pipe(map((h: HabitResponse) => this.normalizeHabit(h)));
  }

  setCompletion(id: number, dateIso: string): Observable<HabitResponse> {
    return this.habitsApi.habitsHabitIdCompletionsDateStrPut(id, dateIso).pipe(
      map((h: HabitResponse) => this.normalizeHabit(h))
    );
  }

  unsetCompletion(id: number, dateIso: string): Observable<HabitResponse> {
    return this.habitsApi.habitsHabitIdCompletionsDateStrDelete(id, dateIso).pipe(
      map((h: HabitResponse) => this.normalizeHabit(h))
    );
  }

  private normalizeHabit(habit: HabitResponse): HabitResponse {
    return { ...habit, completions: habit.completions ?? [] };
  }
}
