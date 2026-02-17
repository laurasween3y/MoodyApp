import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Streak {
  module: string;
  current_streak: number;
  longest_streak: number;
  last_action_date?: string | null;
}

export interface Achievement {
  module: string;
  achievement_key: string;
  unlocked_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class GamificationService {
  private baseUrl = '/gamification';

  constructor(private http: HttpClient) {}

  getStreaks(): Observable<Streak[]> {
    return this.http.get<Streak[]>(`${this.baseUrl}/streaks`);
  }

  getAchievements(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.baseUrl}/achievements`);
  }
}
