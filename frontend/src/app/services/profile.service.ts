import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = 'http://localhost:5000';

export interface Profile {
  email: string;
  username: string;
}

export interface StreakSummary {
  mood_current: number;
  mood_longest: number;
  habit_current: number;
  habit_longest: number;
  journal_current: number;
  journal_longest: number;
  planner_current: number;
  planner_longest: number;
}

export interface AchievementItem {
  module: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  locked: boolean;
  unlocked_at?: string | null;
  progress_current: number;
  progress_target: number;
}

export interface AchievementsResponse {
  unlocked: AchievementItem[];
  all_possible: AchievementItem[];
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private http: HttpClient) {}

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${API_BASE}/profile`);
  }

  updateProfile(payload: Partial<Profile>): Observable<Profile> {
    return this.http.put<Profile>(`${API_BASE}/profile`, payload);
  }

  getStreaks(): Observable<StreakSummary> {
    return this.http.get<StreakSummary>(`${API_BASE}/progress/streaks`);
  }

  getAchievements(): Observable<AchievementsResponse> {
    return this.http.get<AchievementsResponse>(`${API_BASE}/progress/achievements`);
  }
}
