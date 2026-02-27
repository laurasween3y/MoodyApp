import { Injectable } from '@angular/core';
import { PlannerEventResponse } from '../api';
import { UserNotificationSettings } from './notification-settings.service';
import { NotificationService as AppNotificationService } from '../core/notification.service';

type ReminderKind = 'mood' | 'habit';

@Injectable({ providedIn: 'root' })
export class BrowserNotificationService {
  private moodTimeoutId?: number;
  private habitTimeoutId?: number;
  private plannerTimeouts = new Map<string, number>();
  private nextMoodRun?: Date;
  private nextHabitRun?: Date;

  constructor(private appNotifications: AppNotificationService) {}

  get permission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (this.permission === 'unsupported') return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return Notification.requestPermission();
  }

  applySettings(settings: UserNotificationSettings) {
    this.clearDailyReminder('mood');
    this.clearDailyReminder('habit');

    if (settings.mood_reminder_enabled && settings.mood_reminder_time) {
      this.scheduleDailyReminder(
        'mood',
        settings.mood_reminder_time,
        '🌿 Time to log your mood',
        'Take a moment to check in with yourself.',
        '🌿'
      );
    }

    if (settings.habit_reminder_enabled && settings.habit_reminder_time) {
      this.scheduleDailyReminder(
        'habit',
        settings.habit_reminder_time,
        '🌱 Time to check off your habits',
        'Small actions build strong routines.',
        '🌱'
      );
    }
  }

  schedulePlannerReminders(events: PlannerEventResponse[]) {
    this.clearPlannerReminders();

    events.forEach((event) => {
      if (!event.reminder_minutes_before || !event.start_time || !event.event_date) return;
      const eventDate = this.normalizeDate(event.event_date);
      if (!eventDate) return;

      const time = this.normalizeTime(event.start_time);
      if (!time) return;

      const start = new Date(`${eventDate}T${time}`);
      const reminderAt = start.getTime() - event.reminder_minutes_before * 60 * 1000;
      const delay = reminderAt - Date.now();
      if (delay <= 0) return;

      const key = event.id ? String(event.id) : `${eventDate}-${time}-${event.title ?? ''}`;
      const timeoutId = window.setTimeout(() => {
        this.showReminder(
          '📅 Upcoming event',
          event.title || 'Your event is coming up',
          '📅'
        );
        this.plannerTimeouts.delete(key);
      }, delay);
      this.plannerTimeouts.set(key, timeoutId);
    });
  }

  clearAll() {
    this.clearDailyReminder('mood');
    this.clearDailyReminder('habit');
    this.clearPlannerReminders();
  }

  getNextDailyRun(kind: ReminderKind): Date | null {
    return kind === 'mood' ? this.nextMoodRun ?? null : this.nextHabitRun ?? null;
  }

  sendTestNotification() {
    this.showReminder('🔔 Test notification', 'Notifications are working.', '🔔');
  }

  private canNotify(): boolean {
    return this.permission === 'granted';
  }

  private showBrowserNotification(title: string, body: string) {
    if (!this.canNotify()) return;
    try {
      new Notification(title, { body });
    } catch {
      /* ignore */
    }
  }

  private showReminder(title: string, body: string, icon: string) {
    this.appNotifications.show({
      type: 'info',
      title,
      message: body,
      icon,
    });
    this.showBrowserNotification(title, body);
  }

  private scheduleDailyReminder(
    kind: ReminderKind,
    timeStr: string,
    title: string,
    body: string,
    icon: string
  ) {
    const nextRun = this.nextDailyTime(timeStr);
    if (!nextRun) return;
    if (kind === 'mood') {
      this.nextMoodRun = nextRun;
    } else {
      this.nextHabitRun = nextRun;
    }
    const delay = nextRun.getTime() - Date.now();
    const timeoutId = window.setTimeout(() => {
      this.showReminder(title, body, icon);
      this.scheduleDailyReminder(kind, timeStr, title, body, icon);
    }, delay);
    this.setDailyTimeout(kind, timeoutId);
  }

  private clearDailyReminder(kind: ReminderKind) {
    const id = kind === 'mood' ? this.moodTimeoutId : this.habitTimeoutId;
    if (id) {
      clearTimeout(id);
    }
    if (kind === 'mood') {
      this.nextMoodRun = undefined;
    } else {
      this.nextHabitRun = undefined;
    }
    this.setDailyTimeout(kind, undefined);
  }

  private setDailyTimeout(kind: ReminderKind, id?: number) {
    if (kind === 'mood') {
      this.moodTimeoutId = id;
    } else {
      this.habitTimeoutId = id;
    }
  }

  private clearPlannerReminders() {
    this.plannerTimeouts.forEach((id) => clearTimeout(id));
    this.plannerTimeouts.clear();
  }

  private nextDailyTime(timeStr: string): Date | null {
    const time = this.normalizeTime(timeStr);
    if (!time) return null;
    const now = new Date();
    const [hh, mm, ss] = time.split(':').map((v) => Number(v));
    const next = new Date();
    next.setHours(hh, mm, ss || 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  private normalizeTime(value: string): string | null {
    if (!value) return null;
    const parts = value.split(':');
    if (parts.length < 2) return null;
    const hh = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    const ssRaw = parts[2] ?? '00';
    const ss = ssRaw.slice(0, 2).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  private normalizeDate(value: string | Date): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    return null;
  }
}
