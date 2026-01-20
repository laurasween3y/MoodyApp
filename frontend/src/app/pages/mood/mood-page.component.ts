import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { MoodResponse, MoodsService } from '../../api';

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
  editingMoodId?: number;

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
    this.loading = true;
    try {
      if (this.editingMoodId) {
        await firstValueFrom(
          this.moodsService.moodsMoodIdPatch(this.editingMoodId, {
            mood: this.selectedMood,
            note: this.note || undefined,
          })
        );
      } else {
        await firstValueFrom(
          this.moodsService.moodsPost({ mood: this.selectedMood, note: this.note || undefined })
        );
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
    } catch (err) {
      console.error(err);
      this.allMoods = [];
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
    this.note = '';
  }

  moodIcon(key?: string) {
    return this.moods.find(m => m.key === key)?.icon;
  }
}
