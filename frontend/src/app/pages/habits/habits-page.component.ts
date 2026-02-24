import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Frequency, Habit, HabitService } from '../../services/habit.service';
import { calculateStreak, calculateWeeklyProgress, isHabitMet, normalizeTarget } from '../../utils/habit-utils';
import { todayIso } from '../../utils/date-utils';
import { NotificationService } from '../../core/notification.service';
import { buildAchievementToast, extractAwarded } from '../../utils/achievement-utils';

@Component({
  selector: 'app-habits-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './habits-page.component.html',
  styleUrl: './habits-page.component.scss'
})
export class HabitsPageComponent implements OnInit {
  habits: Habit[] = [];
  editingHabitId?: number;
  celebrationMessage = '';
  loading = false;
  error?: string;

  form: { title: string; frequency: Frequency; targetPerWeek: number } = {
    title: '',
    frequency: 'daily',
    targetPerWeek: 7,
  };

  constructor(
    private habitsService: HabitService,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadHabits();
  }

  streakFor(habit: Habit): number {
    return calculateStreak(habit.completions);
  }

  async loadHabits() {
    this.loading = true;
    this.error = undefined;
    try {
      this.habits = await firstValueFrom(this.habitsService.getHabits());
      this.saveCachedHabits(this.habits);
    } catch (err) {
      console.error(err);
      const cached = this.loadCachedHabits();
      if (cached.length) {
        this.habits = cached;
        this.error = 'Offline: showing cached habits';
      } else {
        this.error = 'Failed to load habits';
      }
    } finally {
      this.loading = false;
    }
  }

  async addHabit() {
    if (!this.form.title.trim()) return;

    if (this.editingHabitId) {
      await this.updateHabit();
      return;
    }

    this.loading = true;
    try {
      const created = await firstValueFrom(
        this.habitsService.createHabit({
          title: this.form.title.trim(),
          frequency: this.form.frequency,
          target_per_week: normalizeTarget(this.form.targetPerWeek),
        })
      );
      if ((created as any)?.queued || created.id === -1) {
        const temp: Habit = { ...created, id: Date.now() * -1, title: this.form.title.trim() };
        this.habits = [temp, ...this.habits];
        this.notifications.show({ type: 'info', title: 'Saved offline', message: 'Habit will sync when back online.', icon: '🛰️' });
      } else {
        this.habits = [created, ...this.habits];
      }
      this.saveCachedHabits(this.habits);
      this.resetForm();
    } catch (err) {
      this.error = 'Failed to create habit';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  startEdit(habit: Habit) {
    this.editingHabitId = habit.id;
    this.form = {
      title: habit.title,
      frequency: habit.frequency,
      targetPerWeek: habit.target_per_week,
    };
  }

  async updateHabit() {
    if (!this.editingHabitId) return;
    this.loading = true;
    try {
      const updated = await firstValueFrom(
        this.habitsService.updateHabit(Number(this.editingHabitId), {
          title: this.form.title.trim(),
          frequency: this.form.frequency,
          target_per_week: normalizeTarget(this.form.targetPerWeek),
        })
      );
      if ((updated as any)?.queued || updated.id === -1) {
        this.notifications.show({ type: 'info', title: 'Saved offline', message: 'Habit update will sync when back online.', icon: '🛰️' });
      } else {
        this.habits = this.habits.map(h => (h.id === updated.id ? updated : h));
      }
      this.saveCachedHabits(this.habits);
      this.resetForm();
    } catch (err) {
      this.error = 'Failed to update habit';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async deleteHabit(habit: Habit) {
    this.loading = true;
    try {
      await firstValueFrom(this.habitsService.deleteHabit(Number(habit.id)));
      this.habits = this.habits.filter(h => h.id !== habit.id);
      if (this.editingHabitId === habit.id) {
        this.resetForm();
      }
    } catch (err) {
      this.error = 'Failed to delete habit';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async toggleCompletion(habit: Habit) {
    this.loading = true;
    try {
      const updated = await firstValueFrom(
        this.habitsService.toggleCompletion(Number(habit.id), this.todayISO())
      );

      if ((updated as any)?.queued || updated.id === -1) {
        this.notifications.show({ type: 'info', title: 'Saved offline', message: 'Completion will sync when back online.', icon: '🛰️' });
      } else {
        this.habits = this.habits.map(h => (h.id === updated.id ? updated : h));
        if (isHabitMet(updated)) {
          this.triggerCelebration(habit.title);
        }
        this.notifyAwards(extractAwarded(updated));
      }
      this.saveCachedHabits(this.habits);
    } catch (err) {
      this.error = 'Failed to update completion';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  completedToday(habit: Habit) {
    return habit.completions.includes(this.todayISO());
  }

  weeklyProgress(habit: Habit) {
    return calculateWeeklyProgress(habit);
  }

  onFrequencyChange(freq: Frequency) {
    this.form.frequency = freq;
    if (freq === 'daily') this.form.targetPerWeek = 7;
    if (freq === 'weekly') this.form.targetPerWeek = 1;
  }

  resetForm() {
    this.editingHabitId = undefined;
    this.form = { title: '', frequency: 'daily', targetPerWeek: 7 };
  }

  private todayISO() {
    return todayIso();
  }

  private triggerCelebration(habitName: string) {
    this.celebrationMessage = `Nice! "${habitName}" hit its goal.`;
    setTimeout(() => (this.celebrationMessage = ''), 3200);
  }

  private notifyAwards(awarded: string[] | undefined) {
    if (!awarded?.length) return;
    awarded.forEach((key) => this.notifications.show(buildAchievementToast(key)));
  }

  private saveCachedHabits(habits: Habit[]) {
    try {
      localStorage.setItem('moody_cached_habits', JSON.stringify(habits));
    } catch {
      /* ignore */
    }
  }

  private loadCachedHabits(): Habit[] {
    try {
      const raw = localStorage.getItem('moody_cached_habits');
      return raw ? (JSON.parse(raw) as Habit[]) : [];
    } catch {
      return [];
    }
  }
}
