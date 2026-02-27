import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Configuration } from '../api';

export interface UserNotificationSettings {
  mood_reminder_enabled: boolean;
  mood_reminder_time: string | null;
  habit_reminder_enabled: boolean;
  habit_reminder_time: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotificationSettingsService {
  constructor(private http: HttpClient, private apiConfig: Configuration) {}

  private get apiBase(): string {
    const base = this.apiConfig?.basePath ?? 'http://localhost:5000';
    return base.replace(/\/$/, '');
  }

  getNotificationSettings(): Observable<UserNotificationSettings> {
    return this.http.get<UserNotificationSettings>(`${this.apiBase}/notification-settings`);
  }

  updateNotificationSettings(
    payload: Partial<UserNotificationSettings>
  ): Observable<UserNotificationSettings> {
    return this.http.put<UserNotificationSettings>(
      `${this.apiBase}/notification-settings`,
      payload
    );
  }
}
