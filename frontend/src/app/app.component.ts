import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { MoodsService, MoodResponse } from './api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  mood = '';
  note = '';

  today?: MoodResponse;
  lastCreated?: MoodResponse;
  loading = false;
  error?: string;

  constructor(private moodsService: MoodsService) {}

  async saveMood() {
    this.error = undefined;
    this.loading = true;
    try {
      const created = await firstValueFrom(
        this.moodsService.moodsPost({ mood: this.mood, note: this.note || undefined })
      );
      this.lastCreated = created;
      await this.fetchToday();
    } catch (err) {
      this.error = 'Failed to save mood';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async fetchToday() {
    this.error = undefined;
    this.loading = true;
    try {
      this.today = await firstValueFrom(this.moodsService.moodsTodayGet());
    } catch (err) {
      this.error = 'No mood found for today';
      this.today = undefined;
    } finally {
      this.loading = false;
    }
  }
}
