import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ProfileService, Profile, StreakSummary, AchievementItem } from '../../services/profile.service';
import { BrowserNotificationService, UserNotificationSettings } from '../../services/notification.service';
import { getApiErrorMessage } from '../../core/error-utils';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit {
  loading = false;
  saving = false;
  error?: string;

  profile?: Profile;
  streaks?: StreakSummary;
  achievementsAll: AchievementItem[] = [];
  notificationSettings?: UserNotificationSettings;
  notificationPermission: NotificationPermission | 'unsupported' = 'default';
  notificationSaving = false;
  notificationError?: string;
  nextMoodReminder?: string;
  nextHabitReminder?: string;

  form = this.fb.group({
    email: [''],
    password: [''],
  });

  notificationForm = this.fb.group({
    moodEnabled: [false],
    moodTime: ['09:00'],
    habitEnabled: [false],
    habitTime: ['09:00'],
  });

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private browserNotifications: BrowserNotificationService
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.refreshNotificationPermission();
  }

  get displayName() {
    if (!this.profile) return 'Your profile';
    const { email } = this.profile;
    return email;
  }

  async loadAll() {
    this.loading = true;
    this.error = undefined;
    try {
      const [profile, streaks, achievements] = await Promise.all([
        firstValueFrom(this.profileService.getProfile()),
        firstValueFrom(this.profileService.getStreaks()),
        firstValueFrom(this.profileService.getAchievements()),
      ]);

      this.profile = profile;
      this.streaks = streaks;
      this.achievementsAll = achievements.all_possible.map((ach) => ({
        ...ach,
        icon: ach.icon,
      }));

      this.form.patchValue({
        email: profile.email || '',
        password: '',
      });

      await this.loadNotificationSettings();
    } catch (err) {
      console.error(err);
      this.error = getApiErrorMessage(err, 'Unable to load your profile right now.');
    } finally {
      this.loading = false;
    }
  }

  async save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error = undefined;
    try {
  const { email, password } = this.form.value;
  const payload: any = { email };
  if (password) payload.password = password;
      const updated = await firstValueFrom(this.profileService.updateProfile(payload));
      this.profile = updated;
    } catch (err) {
      console.error(err);
      this.error = getApiErrorMessage(err, 'Unable to save changes right now.');
    } finally {
      this.saving = false;
    }
  }

  async loadNotificationSettings() {
    try {
      const settings = await firstValueFrom(
        this.browserNotifications.getNotificationSettings()
      );
      this.notificationSettings = settings;
      this.notificationForm.patchValue({
        moodEnabled: settings.mood_reminder_enabled,
        moodTime: this.toTimeInput(settings.mood_reminder_time),
        habitEnabled: settings.habit_reminder_enabled,
        habitTime: this.toTimeInput(settings.habit_reminder_time),
      });
      this.syncReminderTimeControls();
      this.browserNotifications.applySettings(settings);
      this.updateNextReminderLabels();
    } catch (err) {
      console.error(err);
      this.notificationError = getApiErrorMessage(err, 'Unable to load reminder settings.');
    }
  }

  async saveNotificationSettings() {
    this.notificationSaving = true;
    this.notificationError = undefined;
    const form = this.notificationForm.getRawValue();
    this.notificationForm.disable({ emitEvent: false });
    try {
      const payload: Partial<UserNotificationSettings> = {
        mood_reminder_enabled: !!form.moodEnabled,
        mood_reminder_time: form.moodEnabled ? form.moodTime || null : null,
        habit_reminder_enabled: !!form.habitEnabled,
        habit_reminder_time: form.habitEnabled ? form.habitTime || null : null,
      };
      const updated = await firstValueFrom(
        this.browserNotifications.updateNotificationSettings(payload)
      );
      this.notificationSettings = updated;
      this.browserNotifications.applySettings(updated);
      this.updateNextReminderLabels();
    } catch (err) {
      console.error(err);
      this.notificationError = getApiErrorMessage(err, 'Unable to save reminder settings.');
    } finally {
      this.notificationSaving = false;
      this.notificationForm.enable({ emitEvent: false });
      this.syncReminderTimeControls();
    }
  }

  async requestNotificationPermission() {
    const result = await this.browserNotifications.requestPermission();
    this.notificationPermission = result;
    if (result === 'granted' && this.notificationSettings) {
      this.browserNotifications.applySettings(this.notificationSettings);
    }
  }

  async handleReminderToggle(type: 'mood' | 'habit') {
    const form = this.notificationForm.value;
    const enabled = type === 'mood' ? !!form.moodEnabled : !!form.habitEnabled;

    if (enabled && this.notificationPermission !== 'granted') {
      if (this.notificationPermission === 'unsupported') {
        this.notificationError = 'System notifications are not supported. In-app reminders will still show.';
        return;
      }

      const result = await this.browserNotifications.requestPermission();
      this.notificationPermission = result;
      if (result !== 'granted') {
        this.notificationError = 'System notifications are off. In-app reminders will still show.';
      }
    }

    this.syncReminderTimeControls();
    await this.saveNotificationSettings();
  }

  async handleReminderTimeChange(type: 'mood' | 'habit') {
    const form = this.notificationForm.value;
    const enabled = type === 'mood' ? !!form.moodEnabled : !!form.habitEnabled;
    if (!enabled) return;

    if (this.notificationPermission !== 'granted') {
      if (this.notificationPermission === 'unsupported') {
        this.notificationError = 'System notifications are not supported. In-app reminders will still show.';
      } else {
        this.notificationError = 'System notifications are off. In-app reminders will still show.';
      }
    }

    await this.saveNotificationSettings();
  }

  async sendTestNotification() {
    if (this.notificationPermission === 'unsupported') {
      this.notificationError = 'System notifications are not supported. In-app reminder shown.';
      this.browserNotifications.sendTestNotification();
      return;
    }
    if (this.notificationPermission !== 'granted') {
      const result = await this.browserNotifications.requestPermission();
      this.notificationPermission = result;
      if (result !== 'granted') {
        this.notificationError = 'System notifications are off. In-app reminder shown.';
        this.browserNotifications.sendTestNotification();
        return;
      }
    }
    this.browserNotifications.sendTestNotification();
  }

  private refreshNotificationPermission() {
    this.notificationPermission = this.browserNotifications.permission;
  }

  private toTimeInput(value: string | null | undefined): string {
    if (!value) return '09:00';
    return value.slice(0, 5);
  }

  private syncReminderTimeControls() {
    const moodEnabled = !!this.notificationForm.value.moodEnabled;
    const habitEnabled = !!this.notificationForm.value.habitEnabled;
    const moodTime = this.notificationForm.get('moodTime');
    const habitTime = this.notificationForm.get('habitTime');

    if (moodTime) {
      moodEnabled ? moodTime.enable({ emitEvent: false }) : moodTime.disable({ emitEvent: false });
    }

    if (habitTime) {
      habitEnabled ? habitTime.enable({ emitEvent: false }) : habitTime.disable({ emitEvent: false });
    }
  }

  private updateNextReminderLabels() {
    const moodNext = this.browserNotifications.getNextDailyRun('mood');
    const habitNext = this.browserNotifications.getNextDailyRun('habit');
    this.nextMoodReminder = moodNext ? moodNext.toLocaleString() : undefined;
    this.nextHabitReminder = habitNext ? habitNext.toLocaleString() : undefined;
  }
}
