import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { endOfWeek, format, isSameWeek, startOfWeek } from 'date-fns';

import { Frequency, Habit, HabitService } from '../../services/habit.service';

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

  constructor(private habitsService: HabitService) {}

  ngOnInit(): void {
    this.loadHabits();
  }

  streakFor(habit: Habit): number {
    // naive streak: count consecutive completions ending today
    const completions = new Set(habit.completions || []);
    let streak = 0;
    let cursor = new Date();
    while (true) {
      const iso = this.formatIso(cursor);
      if (completions.has(iso)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  private formatIso(d: Date): string {
    return format(d, 'yyyy-MM-dd');
  }

  async loadHabits() {
    this.loading = true;
    this.error = undefined;
    try {
      this.habits = await firstValueFrom(this.habitsService.getHabits());
    } catch (err) {
      this.error = 'Failed to load habits';
      console.error(err);
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
          target_per_week: this.normalizeTarget(this.form.targetPerWeek),
        })
      );
      this.habits = [created, ...this.habits];
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
          target_per_week: this.normalizeTarget(this.form.targetPerWeek),
        })
      );
      this.habits = this.habits.map(h => (h.id === updated.id ? updated : h));
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

      this.habits = this.habits.map(h => (h.id === updated.id ? updated : h));
      if (this.isHabitMet(updated)) {
        this.triggerCelebration(habit.title);
      }
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
    const count = this.completionsThisWeek(habit);
    return {
      count,
      target: habit.target_per_week,
      percent: Math.min(100, Math.round((count / habit.target_per_week) * 100)),
      met: count >= habit.target_per_week,
    };
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

  private normalizeTarget(value: number) {
    if (!value || value < 1) return 1;
    if (value > 14) return 14;
    return Math.round(value);
  }

  private todayISO() {
    return format(new Date(), 'yyyy-MM-dd');
  }

  private completionsThisWeek(habit: Habit) {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return habit.completions.filter(dateStr => {
      const d = new Date(dateStr);
      return isSameWeek(d, new Date(), { weekStartsOn: 1 }) && d >= start && d <= end;
    }).length;
  }

  private isHabitMet(habit: Habit) {
    if (habit.frequency === 'daily') return this.completedToday(habit);
    return this.completionsThisWeek(habit) >= habit.target_per_week;
  }

  private triggerCelebration(habitName: string) {
    this.celebrationMessage = `Nice! "${habitName}" hit its goal.`;
    setTimeout(() => (this.celebrationMessage = ''), 3200);
  }
}
