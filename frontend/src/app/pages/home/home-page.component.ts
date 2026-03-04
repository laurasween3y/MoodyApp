import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MoodsService, MoodResponse, PlannerEventResponse, PlannerService } from '../../api';
import { HabitService } from '../../services/habit.service';
import { ProfileService, StreakSummary } from '../../services/profile.service';
import { buildWeekRange, formatWeekRangeLabel, isDateIsoWithinRange, todayIso } from '../../utils/date-utils';
import { HabitDashboardView, decorateHabitForDashboard } from '../../utils/habit-utils';
import { AffirmationService } from '../../core/affirmation.service';
import { getApiErrorMessage } from '../../core/error-utils';
import { MOOD_OPTIONS, MoodOption } from '../../utils/mood-options';
import { JournalEntry, JournalService } from '../../services/journal.service';

const HABITS_CACHE_KEY = 'moody_cached_habits';
const PLANNER_CACHE_KEY = 'moody_cached_planner';
const MOOD_TODAY_CACHE_KEY = 'moody_cached_mood_today';

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
  habitsDue: HabitDashboardView[] = [];
  affirmation = '';
  loadingAffirmation = true;
  streaks?: StreakSummary;
  latestEntry?: JournalEntry;

  moods: MoodOption[] = MOOD_OPTIONS;

  private weekRange = buildWeekRange(0);

  constructor(
    private moodsService: MoodsService,
    private plannerService: PlannerService,
    private habitService: HabitService,
    private affirmationService: AffirmationService,
    private profileService: ProfileService,
    private journalService: JournalService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadAffirmation();
  }

  async loadDashboard() {
    this.loading = true;
    this.error = undefined;
    try {
      await Promise.all([this.loadMood(), this.loadEvents(), this.loadHabits(), this.loadStreaks(), this.loadLatestEntry()]);
    } catch (err) {
      console.error(err);
      this.error = getApiErrorMessage(err, 'Unable to refresh dashboard right now');
    } finally {
      this.loading = false;
    }
  }

  private async loadMood() {
    try {
      this.todayMood = await firstValueFrom(this.moodsService.moodsTodayGet());
      this.saveCached(MOOD_TODAY_CACHE_KEY, this.todayMood);
    } catch (err) {
      const cached = this.loadCached<MoodResponse>(MOOD_TODAY_CACHE_KEY);
      this.todayMood = cached ?? undefined;
    }
  }

  private async loadEvents() {
    try {
      const events = await firstValueFrom(this.plannerService.plannerEventsGet());
      this.weekEvents = (events || [])
        .filter(ev => isDateIsoWithinRange(ev.event_date, this.weekRange))
        .sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''));
      this.saveCached(PLANNER_CACHE_KEY, events || []);
    } catch (err) {
      const cached = this.loadCached<PlannerEventResponse[]>(PLANNER_CACHE_KEY) || [];
      this.weekEvents = cached
        .filter(ev => isDateIsoWithinRange(ev.event_date, this.weekRange))
        .sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''));
    }
  }

  private async loadHabits() {
    try {
      const habits = await firstValueFrom(this.habitService.getHabits());
      this.habitsDue = habits.map(h => decorateHabitForDashboard(h, this.weekRange));
      this.saveCached(HABITS_CACHE_KEY, habits);
    } catch (err) {
      const cached = this.loadCached<any[]>(HABITS_CACHE_KEY) || [];
      this.habitsDue = cached.map(h => decorateHabitForDashboard(h, this.weekRange));
    }
  }

  private async loadStreaks() {
    try {
      this.streaks = await firstValueFrom(this.profileService.getStreaks());
    } catch {
      this.streaks = undefined;
    }
  }

  private async loadLatestEntry() {
    try {
      const journals = await firstValueFrom(this.journalService.getJournals());
      if (!journals.length) {
        this.latestEntry = undefined;
        return;
      }
      const newestJournal = journals[0];
      const entries = await firstValueFrom(this.journalService.getEntries(newestJournal.id));
      this.latestEntry = entries[0];
    } catch {
      this.latestEntry = undefined;
    }
  }

  private loadAffirmation() {
    this.loadingAffirmation = true;
    this.affirmationService.getAffirmation().subscribe({
      next: (res) => {
        this.affirmation = res.affirmation;
        this.loadingAffirmation = false;
      },
      error: () => {
        this.affirmation = "You're doing better than you think 💛";
        this.loadingAffirmation = false;
      },
    });
  }

  async toggleHabit(habit: HabitDashboardView) {
    if (this.habitBusy.has(habit.id)) return;
    this.habitBusy.add(habit.id);

    try {
      const updated = await firstValueFrom(
        this.habitService.toggleCompletion(habit.id, todayIso())
      );
      this.habitsDue = this.habitsDue.map(h =>
        h.id === updated.id ? decorateHabitForDashboard(updated, this.weekRange) : h
      );
      await this.loadHabits();
    } catch (err) {
      console.error(err);
    } finally {
      this.habitBusy.delete(habit.id);
    }
  }

  weekRangeLabel() {
    return formatWeekRangeLabel(this.weekRange);
  }

  moodLabel(mood?: string) {
    if (!mood) return 'No mood logged yet';
    return mood.charAt(0).toUpperCase() + mood.slice(1);
  }

  moodIcon(key?: string) {
    if (!key) return undefined;
    return this.moods.find(m => m.key === key)?.icon;
  }

  private saveCached(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }

  private loadCached<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}
