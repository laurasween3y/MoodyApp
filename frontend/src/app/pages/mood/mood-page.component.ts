import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isFuture,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import { MoodResponse, MoodsService } from '../../api';

type CalendarDay = {
  date: Date;
  iso: string;
  inCurrentMonth: boolean;
  mood?: MoodResponse;
};

@Component({
  selector: 'app-mood-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mood-page.component.html',
  styleUrl: './mood-page.component.scss'
})
export class MoodPageComponent implements OnInit {
  note = '';
  selectedMood?: string;
  selectedDateISO?: string;
  editingMoodId?: number;
  private readonly cacheKey = 'moody_cached_moods';

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

  today?: MoodResponse;
  allMoods: MoodResponse[] = [];
  moodByDate = new Map<string, MoodResponse>();
  calendarDays: CalendarDay[] = [];
  currentMonth = new Date();
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  loading = false;
  error?: string;

  constructor(private moodsService: MoodsService) {}

  ngOnInit(): void {
    this.refreshData();
  }

  async refreshData(manageLoading = true) {
    if (manageLoading) this.loading = true;
    this.error = undefined;
    try {
      await Promise.all([this.fetchToday(), this.fetchAll()]);
      this.buildCalendarDays();
    } finally {
      if (manageLoading) this.loading = false;
    }
  }

  async saveMood() {
    this.error = undefined;
    if (!this.selectedMood) {
      this.error = 'Pick a mood to continue';
      return;
    }
    const payload: any = {
      mood: this.selectedMood,
      note: this.note || undefined,
      date: this.selectedDateISO || format(new Date(), 'yyyy-MM-dd'),
    };
    this.loading = true;
    try {
      if (this.editingMoodId) {
        await firstValueFrom(
          this.moodsService.moodsMoodIdPatch(this.editingMoodId, payload)
        );
      } else {
        await firstValueFrom(this.moodsService.moodsPost(payload));
      }

      this.resetForm();
      await this.refreshData(false);
    } catch (err) {
      this.error = this.editingMoodId ? 'Failed to update mood' : 'Failed to save mood';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async fetchToday() {
    try {
      this.today = await firstValueFrom(this.moodsService.moodsTodayGet());
    } catch (err) {
      this.today = undefined;
    }
  }

  async fetchAll() {
    try {
      this.allMoods = await firstValueFrom(this.moodsService.moodsGet());
      this.buildMoodMap();
      this.saveCachedMoods(this.allMoods);
    } catch (err) {
      console.error(err);
      const cached = this.loadCachedMoods();
      if (cached.length) {
        this.allMoods = cached;
        this.buildMoodMap();
        this.today = this.moodByDate.get(format(new Date(), 'yyyy-MM-dd'));
        this.error = 'Offline: showing cached moods';
      } else {
        this.allMoods = [];
        this.moodByDate.clear();
      }
    } finally {
      this.buildCalendarDays();
    }
  }

  async deleteMood(mood: MoodResponse) {
    this.loading = true;
    try {
      await firstValueFrom(this.moodsService.moodsMoodIdDelete(mood.id!));
      if (this.editingMoodId === mood.id) {
        this.resetForm();
      }
      await this.refreshData(false);
    } catch (err) {
      this.error = 'Failed to delete mood';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  startEdit(mood: MoodResponse) {
    this.editingMoodId = mood.id;
    this.selectedMood = mood.mood;
    this.note = mood.note || '';
  }

  resetForm() {
    this.editingMoodId = undefined;
    this.selectedMood = undefined;
    this.selectedDateISO = undefined;
    this.note = '';
  }

  moodIcon(key?: string) {
    return this.moods.find(m => m.key === key)?.icon;
  }

  isFutureDate(day: Date) {
    return isFuture(day);
  }

  get selectedMoodEntry(): MoodResponse | undefined {
    if (!this.selectedDateISO) return undefined;
    return this.moodByDate.get(this.selectedDateISO);
  }

  changeMonth(delta: number) {
    this.currentMonth = addMonths(this.currentMonth, delta);
    this.buildCalendarDays();
  }

  openDay(day: CalendarDay) {
    if (isFuture(day.date)) return;

    this.selectedDateISO = day.iso;
    this.editingMoodId = day.mood?.id;
    this.selectedMood = day.mood?.mood;
    this.note = day.mood?.note || '';
  }

  private buildMoodMap() {
    this.moodByDate.clear();
    this.allMoods.forEach(m => {
      const iso = typeof m.date === 'string' ? m.date : format(m.date as any, 'yyyy-MM-dd');
      this.moodByDate.set(iso, m);
    });
  }

  private saveCachedMoods(moods: MoodResponse[]) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(moods));
    } catch (err) {
      console.warn('Unable to cache moods locally', err);
    }
  }

  private loadCachedMoods(): MoodResponse[] {
    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (!raw) return [];
      return JSON.parse(raw) as MoodResponse[];
    } catch (err) {
      console.warn('Unable to read cached moods', err);
      return [];
    }
  }

  private buildCalendarDays() {
    const start = startOfWeek(startOfMonth(this.currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(this.currentMonth), { weekStartsOn: 0 });

    this.calendarDays = eachDayOfInterval({ start, end }).map(day => {
      const iso = format(day, 'yyyy-MM-dd');
      return {
        date: day,
        iso,
        inCurrentMonth: isSameMonth(day, this.currentMonth),
        mood: this.moodByDate.get(iso),
      };
    });
  }
}
