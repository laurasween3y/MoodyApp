import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Frequency = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: number;
  title: string;
  frequency: Frequency;
  target_per_week: number;
  created_at?: string;
  updated_at?: string;
  completions: string[];
}

@Injectable({ providedIn: 'root' })
export class HabitService {
  private readonly apiBase = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  getHabits(): Observable<Habit[]> {
    return this.http.get<Habit[]>(`${this.apiBase}/habits/`);
  }

  createHabit(payload: { title: string; frequency: Frequency; target_per_week: number }): Observable<Habit> {
    return this.http.post<Habit>(`${this.apiBase}/habits/`, payload);
  }

  updateHabit(
    id: number,
    payload: Partial<{ title: string; frequency: Frequency; target_per_week: number }>
  ): Observable<Habit> {
    return this.http.patch<Habit>(`${this.apiBase}/habits/${id}`, payload);
  }

  deleteHabit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/habits/${id}`);
  }

  toggleCompletion(id: number, dateIso: string): Observable<Habit> {
    return this.http.post<Habit>(`${this.apiBase}/habits/${id}/toggle`, { date: dateIso });
  }

  setCompletion(id: number, dateIso: string): Observable<Habit> {
    return this.http.put<Habit>(`${this.apiBase}/habits/${id}/completions/${dateIso}`, {});
  }

  unsetCompletion(id: number, dateIso: string): Observable<Habit> {
    return this.http.delete<Habit>(`${this.apiBase}/habits/${id}/completions/${dateIso}`);
  }
}
