import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { JournalEntry, JournalService } from '../../services/journal.service';

@Component({
  selector: 'app-entry-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entry-detail.component.html',
  styleUrl: './entry-detail.component.scss'
})
export class EntryDetailComponent implements OnInit {
  journalId!: number;
  entryId?: number;
  entryTitle = '';
  entryContent = '';
  entryDate = new Date().toISOString().slice(0, 10);
  loading = false;
  error?: string;
  isCreate = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private journalService: JournalService
  ) {}

  ngOnInit(): void {
    this.journalId = Number(this.route.snapshot.paramMap.get('journalId'));
    const entryParam = this.route.snapshot.paramMap.get('entryId');
    this.isCreate = entryParam === 'new' || entryParam === null;
    if (!this.isCreate && entryParam) {
      this.entryId = Number(entryParam);
      this.loadEntry();
    }
  }

  async loadEntry() {
    if (!this.entryId) return;
    this.loading = true;
    this.error = undefined;
    try {
      const entry = await firstValueFrom(this.journalService.getEntry(this.journalId, this.entryId));
      this.entryTitle = entry.title || '';
      this.entryContent = entry.content;
      this.entryDate = entry.entry_date;
    } catch (err) {
      this.error = 'Failed to load entry';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async saveEntry() {
    if (!this.entryContent.trim()) {
      this.error = 'Content is required';
      return;
    }
    this.loading = true;
    this.error = undefined;
    try {
      if (this.isCreate) {
        await firstValueFrom(
          this.journalService.createEntry(this.journalId, {
            title: this.entryTitle || null,
            content: this.entryContent,
            entry_date: this.entryDate,
          })
        );
      } else if (this.entryId) {
        await firstValueFrom(
          this.journalService.updateEntry(this.journalId, this.entryId, {
            title: this.entryTitle || null,
            content: this.entryContent,
            entry_date: this.entryDate,
          })
        );
      }
      this.goBack();
    } catch (err) {
      this.error = this.isCreate ? 'Failed to create entry' : 'Failed to save entry';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async deleteEntry() {
    if (this.isCreate || !this.entryId) {
      this.goBack();
      return;
    }
    if (!confirm('Delete this entry?')) return;
    this.loading = true;
    try {
      await firstValueFrom(this.journalService.deleteEntry(this.journalId, this.entryId));
      this.goBack();
    } catch (err) {
      this.error = 'Failed to delete entry';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    this.router.navigate(['/journal', this.journalId]);
  }
}
