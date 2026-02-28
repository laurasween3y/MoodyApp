import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { PlannerEventResponse, PlannerEventCreate, PlannerService } from '../../api';
import { NotificationService } from '../../core/notification.service';
import { extractAwarded } from '../../utils/achievement-utils';
import { AchievementCatalogService } from '../../services/achievement-catalog.service';
import { BrowserNotificationService } from '../../services/notification.service';
import { getApiErrorMessage } from '../../core/error-utils';

type PlannerUiEvent = PlannerEventResponse & { isHoliday?: boolean; queued?: boolean };

@Component({
  selector: 'app-planner-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planner-page.component.html',
  styleUrl: './planner-page.component.scss'
})
export class PlannerPageComponent implements OnInit {
  view: 'planner' | 'calendar' = 'planner';
  events: PlannerUiEvent[] = [];
  holidayEvents: PlannerUiEvent[] = [];
  loading = false;
  error?: string;
  editingId?: number;
  currentMonth = new Date();
  calendarDays: { date: Date; iso: string; inMonth: boolean; events: PlannerUiEvent[] }[] = [];

  form: {
    title: string;
    description: string;
    event_date: string;
    start_time: string;
    end_time: string;
    reminder_minutes_before: number | null;
  } = this.defaultForm();

  reminderOptions = [
    { label: 'No reminder', value: null },
    { label: '5 minutes before', value: 5 },
    { label: '10 minutes before', value: 10 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '1 day before', value: 1440 },
  ];

  constructor(
    private plannerService: PlannerService,
    private notifications: NotificationService,
    private browserNotifications: BrowserNotificationService,
    private achievements: AchievementCatalogService
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  async loadEvents() {
    this.loading = true;
    this.error = undefined;
    try {
  const events = await firstValueFrom(this.plannerService.plannerEventsGet());
  this.events = this.sortEvents(events || []);
      this.holidayEvents = this.buildHolidayEvents(this.currentMonth.getFullYear());
      this.buildCalendar();
      this.saveCachedEvents(this.events);
      this.browserNotifications.schedulePlannerReminders(this.events);
    } catch (err) {
      console.error(err);
      const cached = this.loadCachedEvents();
      if (cached.length) {
        this.events = cached;
        this.error = 'Offline: showing cached events';
        this.buildCalendar();
      } else {
        this.error = getApiErrorMessage(err, 'Failed to load events');
      }
    } finally {
      this.loading = false;
    }
  }

  async saveEvent() {
    if (!this.form.title.trim()) return;
    const eventDate = this.form.event_date || format(new Date(), 'yyyy-MM-dd');
    const payload: PlannerEventCreate = {
      title: this.form.title.trim(),
      description: this.form.description?.trim() || undefined,
      event_date: eventDate,
      start_time: this.form.start_time?.trim() || undefined,
      end_time: this.form.end_time?.trim() || undefined,
      reminder_minutes_before:
        this.form.reminder_minutes_before === null ? undefined : this.form.reminder_minutes_before,
    };

    this.loading = true;
    this.error = undefined;
    try {
      if (this.editingId) {
        const updated = await firstValueFrom(
          this.plannerService.plannerEventsEventIdPut(this.editingId, payload)
        );
        if ((updated as any)?.queued) {
          this.notifications.show({ type: 'info', title: 'Saved offline', message: 'We will sync this update when online.' });
        } else {
          this.events = this.sortEvents(
            this.events.map(e => (e.id === updated.id ? updated : e))
          );
          this.browserNotifications.schedulePlannerReminders(this.events);
        }
      } else {
        const created = await firstValueFrom(this.plannerService.plannerEventsPost(payload));
        if ((created as any)?.queued) {
          this.notifications.show({ type: 'info', title: 'Saved offline', message: 'We will sync this event when online.' });
        } else {
          this.events = this.sortEvents([created, ...this.events]);
          this.notifyAwards(extractAwarded(created));
          this.browserNotifications.schedulePlannerReminders(this.events);
        }
      }
      this.saveCachedEvents(this.events);
      this.resetForm();
      this.buildCalendar();
    } catch (err) {
      console.error(err);
      this.error = getApiErrorMessage(
        err,
        this.editingId ? 'Failed to update event' : 'Failed to create event'
      );
    } finally {
      this.loading = false;
    }
  }

  startEdit(event: PlannerUiEvent) {
    this.editingId = event.id;
    this.form = {
      title: event.title || '',
      description: event.description || '',
      event_date: event.event_date || format(new Date(), 'yyyy-MM-dd'),
      start_time: this.toTimeInput(event.start_time),
      end_time: this.toTimeInput(event.end_time),
      reminder_minutes_before: event.reminder_minutes_before ?? null,
    };
    this.view = 'planner';
  }

  async deleteEvent(event: PlannerUiEvent) {
    if (!event.id || event.isHoliday) return;
    this.loading = true;
    this.error = undefined;
    try {
      await firstValueFrom(this.plannerService.plannerEventsEventIdDelete(event.id));
      this.events = this.events.filter(e => e.id !== event.id);
      if (this.editingId === event.id) this.resetForm();
      this.buildCalendar();
      this.browserNotifications.schedulePlannerReminders(this.events);
    } catch (err) {
      console.error(err);
      this.error = getApiErrorMessage(err, 'Failed to delete event');
    } finally {
      this.loading = false;
    }
  }

  resetForm() {
    this.editingId = undefined;
    this.form = this.defaultForm();
  }

  changeMonth(delta: number) {
    const prevYear = this.currentMonth.getFullYear();
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + delta, 1);
    const newYear = this.currentMonth.getFullYear();
    if (newYear !== prevYear) {
      this.holidayEvents = this.buildHolidayEvents(newYear);
    }
    this.buildCalendar();
  }

  openDay(day: { iso: string }) {
  this.view = 'planner';
    this.form.event_date = day.iso;
  }

  get groupedEvents() {
    const map = new Map<string, PlannerUiEvent[]>();
    this.plannerEvents.forEach(ev => {
      const iso = ev.event_date || format(new Date(), 'yyyy-MM-dd');
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso)!.push(ev);
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([iso, list]) => ({ iso, events: this.sortEvents(list) }));
  }

  private defaultForm() {
    return {
      title: '',
      description: '',
      event_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '',
      end_time: '',
      reminder_minutes_before: null as number | null,
    };
  }

  private sortEvents<T extends PlannerEventResponse>(list: T[]): T[] {
    return [...list].sort((a, b) => {
      const da = a.event_date || '';
      const db = b.event_date || '';
      if (da !== db) return da < db ? -1 : 1;
      const sa = a.start_time || '';
      const sb = b.start_time || '';
      return sa.localeCompare(sb);
    });
  }

  private buildCalendar() {
    const start = startOfWeek(startOfMonth(this.currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(this.currentMonth), { weekStartsOn: 0 });
    this.calendarDays = eachDayOfInterval({ start, end }).map(day => {
      const iso = format(day, 'yyyy-MM-dd');
      return {
        date: day,
        iso,
        inMonth: isSameMonth(day, this.currentMonth),
        events: this.allEvents.filter(ev => ev.event_date === iso),
      };
    });
  }

  private toTimeInput(val?: string | null) {
    if (!val) return '';
    return val.substring(0, 5);
  }

  isToday(d: Date) {
    return isSameDay(d, new Date());
  }

  timeLabel(ev: PlannerEventResponse) {
    if (ev.start_time && ev.end_time) return `${ev.start_time.slice(0, 5)} - ${ev.end_time.slice(0, 5)}`;
    if (ev.start_time) return ev.start_time.slice(0, 5);
    return 'All day';
  }

  get allEvents(): PlannerUiEvent[] {
    return this.sortEvents([...this.events, ...this.holidayEvents]);
  }

  private get plannerEvents(): PlannerUiEvent[] {
    const todayIso = format(new Date(), 'yyyy-MM-dd');
    const userDateSet = new Set((this.events || []).map(ev => ev.event_date || todayIso));
    const holidaysOnUserDays = this.holidayEvents.filter(h => h.event_date && userDateSet.has(h.event_date));
    return this.sortEvents([...(this.events || []), ...holidaysOnUserDays]);
  }

  private buildHolidayEvents(year: number): PlannerUiEvent[] {
    const fmt = (month: number, day: number) => format(new Date(year, month - 1, day), 'yyyy-MM-dd');
    const templates = [
      { title: "New Year's Day", month: 1, day: 1 },
      { title: "Valentine's Day", month: 2, day: 14 },
      { title: "St. Patrick's Day", month: 3, day: 17 },
      { title: "Easter", month: 3, day: 31 },
      { title: "April Fools' Day", month: 4, day: 1 },
      { title: "Mother's Day", month: 5, day: 12 },
      { title: "Father's Day", month: 6, day: 16 },
      { title: "Independence Day", month: 7, day: 4 },
      { title: "Halloween", month: 10, day: 31 },
      { title: "Thanksgiving", month: 11, day: 28 },
      { title: "Christmas Eve", month: 12, day: 24 },
      { title: "Christmas Day", month: 12, day: 25 },
      { title: "New Year's Eve", month: 12, day: 31 },
    ];

    return templates.map(t => ({
      title: t.title,
      event_date: fmt(t.month, t.day),
      description: 'Holiday',
      isHoliday: true,
    } as any));
  }

  private notifyAwards(awarded: string[] | undefined) {
    if (!awarded?.length) return;
    awarded.forEach((key) => this.notifications.show(this.achievements.buildToast(key)));
  }

  private saveCachedEvents(events: PlannerUiEvent[]) {
    try {
      const limited = events.slice(0, 100);
      localStorage.setItem('moody_cached_planner', JSON.stringify(limited));
    } catch {
      /* ignore */
    }
  }

  private loadCachedEvents(): PlannerUiEvent[] {
    try {
      const raw = localStorage.getItem('moody_cached_planner');
      return raw ? (JSON.parse(raw) as PlannerUiEvent[]) : [];
    } catch {
      return [];
    }
  }
}
