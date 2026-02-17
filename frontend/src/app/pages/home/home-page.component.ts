import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { addDays, endOfWeek, format, isWithinInterval, parseISO, startOfWeek } from 'date-fns';

import { MoodsService, MoodResponse, PlannerEventResponse, PlannerService } from '../../api';
import { Habit, HabitService } from '../../services/habit.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {
  loading = false;
  error?: string;
  habitBusy = new Set<number>();

  todayMood?: MoodResponse;
  weekEvents: PlannerEventResponse[] = [];
  habitsDue: (Habit & { isDoneToday: boolean; remainingThisWeek?: number; dueToday: boolean })[] = [];

  moods = [
    { key: 'happy', label: 'Happy', icon: 'assets/moods/happy.png' },
    { key: 'sad', label: 'Sad', icon: 'assets/moods/sad.png' },
    { key: 'angry', label: 'Angry', icon: 'assets/moods/angry.png' },
    { key: 'excited', label: 'Excited', icon: 'assets/moods/excited.png' },
    { key: 'sick', label: 'Sick', icon: 'assets/moods/sick.png' },
    { key: 'tired', label: 'Tired', icon: 'assets/moods/tired.png' },
    { key: 'loved', label: 'Loved', icon: 'assets/moods/loved.png' },
    { key: 'anxious', label: 'Anxious', icon: 'assets/moods/anxious.png' },
    { key: 'peaceful', label: 'Peaceful', icon: 'assets/moods/peaceful.png' },
    { key: 'bored', label: 'Bored', icon: 'assets/moods/bored.png' },
    { key: 'silly', label: 'Silly', icon: 'assets/moods/silly.png' },
    { key: 'fine', label: 'Fine', icon: 'assets/moods/fine.png' },
  ];

  private weekRange = {
    start: startOfWeek(new Date(), { weekStartsOn: 0 }),
    end: endOfWeek(new Date(), { weekStartsOn: 0 })
  };

  constructor(
    private moodsService: MoodsService,
    private plannerService: PlannerService,
    private habitService: HabitService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  async loadDashboard() {
    this.loading = true;
    this.error = undefined;
    try {
      await Promise.all([this.loadMood(), this.loadEvents(), this.loadHabits()]);
    } catch (err) {
      console.error(err);
      this.error = 'Unable to refresh dashboard right now';
    } finally {
      this.loading = false;
    }
  }

  private async loadMood() {
    try {
      this.todayMood = await firstValueFrom(this.moodsService.moodsTodayGet());
    } catch (err) {
      this.todayMood = undefined;
    }
  }

  private async loadEvents() {
    try {
      const events = await firstValueFrom(this.plannerService.plannerEventsGet());
      this.weekEvents = (events || [])
        .filter(ev => this.isWithinThisWeek(ev.event_date))
        .sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''));
    } catch (err) {
      this.weekEvents = [];
      console.error(err);
    }
  }

  private async loadHabits() {
    try {
      const habits = await firstValueFrom(this.habitService.getHabits());
      this.habitsDue = habits.map(h => this.decorateHabit(h));
    } catch (err) {
      this.habitsDue = [];
      console.error(err);
    }
  }

  async toggleHabit(habit: Habit & { isDoneToday: boolean }) {
    if (this.habitBusy.has(habit.id)) return;
    this.habitBusy.add(habit.id);

    try {
      const updated = await firstValueFrom(
        this.habitService.toggleCompletion(habit.id, this.currentTodayIso())
      );
      this.habitsDue = this.habitsDue.map(h =>
        h.id === updated.id ? this.decorateHabit(updated) : h
      );
      await this.loadHabits();
    } catch (err) {
      console.error(err);
    } finally {
      this.habitBusy.delete(habit.id);
    }
  }

  private decorateHabit(h: Habit) {
    const todayIso = this.currentTodayIso();
    const completions = h.completions || [];
    const isDoneToday = completions.includes(todayIso);
    let dueToday = false;
    let remainingThisWeek = undefined as number | undefined;

    if (h.frequency === 'daily' || h.frequency === 'custom') {
      dueToday = !isDoneToday;
    } else {
      const countThisWeek = completions.filter(d => this.isWithinThisWeek(d)).length;
      remainingThisWeek = Math.max(h.target_per_week - countThisWeek, 0);
      dueToday = remainingThisWeek > 0 && !isDoneToday;
    }

    return { ...h, isDoneToday, remainingThisWeek, dueToday };
  }

  private currentTodayIso() {
    return format(new Date(), 'yyyy-MM-dd');
  }

  private isWithinThisWeek(dateIso?: string | null) {
    if (!dateIso) return false;
    try {
      const date = parseISO(dateIso);
      return isWithinInterval(date, this.weekRange);
    } catch (err) {
      return false;
    }
  }

  weekRangeLabel() {
    const startLabel = format(this.weekRange.start, 'MMM d');
    const endLabel = format(addDays(this.weekRange.end, 0), 'MMM d');
    return `${startLabel} – ${endLabel}`;
  }

  moodLabel(mood?: string) {
    if (!mood) return 'No mood logged yet';
    return mood.charAt(0).toUpperCase() + mood.slice(1);
  }

  moodIcon(key?: string) {
    if (!key) return undefined;
    return this.moods.find(m => m.key === key)?.icon;
  }
}
