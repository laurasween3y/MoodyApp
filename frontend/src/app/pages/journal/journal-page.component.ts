import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Journal, JournalEntry, JournalService } from '../../services/journal.service';
import { getApiErrorMessage } from '../../core/error-utils';

const JOURNALS_CACHE_KEY = 'moody_cached_journals';
import { ActivatedRoute, Router } from '@angular/router';
import { buildEntryPreview } from '../../utils/journal-utils';

@Component({
  selector: 'app-journal-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-page.component.html',
  styleUrl: './journal-page.component.scss'
})
export class JournalPageComponent implements OnInit {
  @ViewChild('createFormRef') createFormRef?: ElementRef<HTMLDivElement>;
  journals: Journal[] = [];
  entries: JournalEntry[] = [];
  selectedJournalId?: number;

  // Journal form
  journalTitle = '';
  journalDescription = '';
  journalCoverFile?: File;
  editingJournalId?: number;
  showCreateForm = false;

  loading = false;
  entryLoading = false;
  error?: string;

  get selectedJournal(): Journal | undefined {
    return this.journals.find(j => j.id === this.selectedJournalId);
  }

  constructor(
    private journalsService: JournalService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    this.loading = true;
    try {
      if (!navigator.onLine) {
        const cached = this.loadCachedJournals();
        if (cached.length) {
          this.journals = cached;
          this.error = 'Offline: showing cached journals';
        } else {
          this.journals = [];
          this.error = 'Offline and no cached journals available';
        }
      } else {
        this.journals = await firstValueFrom(this.journalsService.getJournals());
        this.saveCachedJournals(this.journals);
      }
      this.route.paramMap.subscribe(params => {
        const paramId = Number(params.get('journalId'));
        const targetId = paramId && this.journals.some(j => j.id === paramId)
          ? paramId
          : undefined;
        this.selectJournal(targetId);
      });
    } catch (err) {
      console.error(err);
      const cached = this.loadCachedJournals();
      if (cached.length) {
        this.journals = cached;
        this.error = 'Offline: showing cached journals';
      } else {
        this.error = getApiErrorMessage(err, 'Failed to load journals');
      }
    } finally {
      this.loading = false;
    }
  }

  goToJournal(id?: number) {
    if (!id) return;
    this.router.navigate(['/journal', id]);
  }

  goToNewEntry() {
    if (!this.selectedJournalId) return;
    this.router.navigate(['/journal', this.selectedJournalId, 'entries', 'new']);
  }

  goToEntry(entry: JournalEntry) {
    if (!this.selectedJournalId) return;
    this.router.navigate(['/journal', this.selectedJournalId, 'entries', entry.id]);
  }

  async selectJournal(id?: number) {
    if (!id) {
      this.selectedJournalId = undefined;
      this.entries = [];
      return;
    }
    if (this.selectedJournalId === id && this.entries.length) return;
    this.selectedJournalId = id;
    this.editingJournalId = undefined;
    await this.loadEntries();
  }

  async createJournal() {
    if (!this.journalTitle.trim()) return;
    this.loading = true;
    try {
      const journal = await firstValueFrom(
        this.journalsService.createJournal({ title: this.journalTitle.trim(), description: this.journalDescription || undefined })
      );
      if ((journal as any)?.queued) {
        this.error = undefined;
      }
      if (this.journalCoverFile && !(journal as any)?.queued && journal.id > 0) {
        await this.uploadCover(journal.id, this.journalCoverFile);
      }
      this.journals.unshift(journal);
      this.saveCachedJournals(this.journals);
      this.journalTitle = '';
      this.journalDescription = '';
      this.journalCoverFile = undefined;
      this.showCreateForm = false;
      if (!(journal as any)?.queued) {
        this.router.navigate(['/journal', journal.id]);
      }
    } catch (err: any) {
      this.error = getApiErrorMessage(err, 'Failed to create journal');
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  openCreateForm() {
    this.showCreateForm = true;
    setTimeout(() => {
      this.createFormRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  startEditJournal(journal: Journal) {
    this.editingJournalId = journal.id;
    this.journalTitle = journal.title;
    this.journalDescription = journal.description || '';
    this.journalCoverFile = undefined;
    this.showCreateForm = true;
  }

  async saveJournalEdits() {
    if (!this.editingJournalId) return;
    this.loading = true;
    try {
      const updated = await firstValueFrom(
        this.journalsService.updateJournal(this.editingJournalId, {
          title: this.journalTitle.trim() || undefined,
          description: this.journalDescription || null,
        })
      );
      if ((updated as any)?.queued) {
        this.error = undefined;
      }
      if (this.journalCoverFile && !(updated as any)?.queued && updated.id > 0) {
        await this.uploadCover(updated.id, this.journalCoverFile);
        updated.cover_url = this.journalCoverFile ? updated.cover_url : updated.cover_url;
      }
      this.journals = this.journals.map(j => (j.id === updated.id ? updated : j));
      this.saveCachedJournals(this.journals);
      this.editingJournalId = undefined;
      this.journalTitle = '';
      this.journalDescription = '';
      this.journalCoverFile = undefined;
      this.showCreateForm = false;
    } catch (err) {
      this.error = getApiErrorMessage(err, 'Failed to update journal');
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  cancelJournalEdit() {
    this.editingJournalId = undefined;
    this.journalTitle = '';
    this.journalDescription = '';
    this.journalCoverFile = undefined;
    this.showCreateForm = false;
  }

  async deleteJournal(journal: Journal) {
    if (!confirm(`Delete journal "${journal.title}"? This removes all its entries.`)) return;
    this.loading = true;
    try {
      await firstValueFrom(this.journalsService.deleteJournal(journal.id));
      this.journals = this.journals.filter(j => j.id !== journal.id);
      if (this.selectedJournalId === journal.id) {
        const nextId = this.journals[0]?.id;
        this.router.navigate(nextId ? ['/journal', nextId] : ['/journal']);
      }
    } catch (err) {
      this.error = getApiErrorMessage(err, 'Failed to delete journal');
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  onCoverSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.journalCoverFile = input.files[0];
    }
  }

  private async uploadCover(journalId: number, file: File) {
    try {
      const updated = await firstValueFrom(this.journalsService.uploadCover(journalId, file));
      this.journals = this.journals.map(j => (j.id === updated.id ? updated : j));
      this.saveCachedJournals(this.journals);
      if (this.selectedJournalId === updated.id) {
        this.selectedJournalId = updated.id; // trigger getter use
      }
    } catch (err) {
      console.error('Cover upload failed', err);
    }
  }

  async loadEntries() {
    if (!this.selectedJournalId) {
      this.entries = [];
      return;
    }
    this.entryLoading = true;
    this.error = undefined;
    try {
      if (!navigator.onLine) {
        const cached = this.loadCachedEntries(this.selectedJournalId) || [];
        if (cached.length) {
          this.entries = cached;
          this.error = 'Offline: showing cached entries';
          return;
        }
      }
      this.entries = await firstValueFrom(this.journalsService.getEntries(this.selectedJournalId));
      this.saveCachedEntries(this.selectedJournalId, this.entries);
    } catch (err) {
      console.error(err);
      const cached = this.loadCachedEntries(this.selectedJournalId) || [];
      if (cached.length) {
        this.entries = cached;
        this.error = 'Offline: showing cached entries';
      } else {
        this.error = getApiErrorMessage(err, 'Failed to load entries');
        this.entries = [];
      }
    } finally {
      this.entryLoading = false;
    }
  }

  async deleteEntry(entry: JournalEntry) {
    if (!this.selectedJournalId) return;
    if (!confirm('Delete this entry?')) return;
    this.entryLoading = true;
    try {
      await firstValueFrom(this.journalsService.deleteEntry(this.selectedJournalId, entry.id));
      this.entries = this.entries.filter(e => e.id !== entry.id);
    } catch (err) {
      this.error = getApiErrorMessage(err, 'Failed to delete entry');
      console.error(err);
    } finally {
      this.entryLoading = false;
    }
  }

  previewText(entry: JournalEntry): string {
    return buildEntryPreview(entry.content_json);
  }

  private saveCachedJournals(journals: Journal[]) {
    try {
      const limited = journals.slice(0, 50);
      localStorage.setItem(JOURNALS_CACHE_KEY, JSON.stringify(limited));
    } catch {
      /* ignore */
    }
  }

  private loadCachedJournals(): Journal[] {
    try {
      const raw = localStorage.getItem(JOURNALS_CACHE_KEY);
      return raw ? (JSON.parse(raw) as Journal[]) : [];
    } catch {
      return [];
    }
  }

  private saveCachedEntries(journalId: number, entries: JournalEntry[]) {
    try {
      const limited = entries.slice(-20);
      localStorage.setItem(`moody_cached_entries_${journalId}`, JSON.stringify(limited));
    } catch {
      /* ignore */
    }
  }

  private loadCachedEntries(journalId: number): JournalEntry[] | null {
    try {
      const raw = localStorage.getItem(`moody_cached_entries_${journalId}`);
      return raw ? (JSON.parse(raw) as JournalEntry[]) : null;
    } catch {
      return null;
    }
  }
}
