import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Journal, JournalEntry, JournalService } from '../../services/journal.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-journal-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
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
      this.journals = await firstValueFrom(this.journalsService.getJournals());
      this.route.paramMap.subscribe(params => {
        const paramId = Number(params.get('journalId'));
        const targetId = paramId && this.journals.some(j => j.id === paramId)
          ? paramId
          : undefined;
        this.selectJournal(targetId);
      });
    } catch (err) {
      this.error = 'Failed to load journals';
      console.error(err);
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
      if (this.journalCoverFile) {
        await this.uploadCover(journal.id, this.journalCoverFile);
      }
      this.journals.unshift(journal);
      this.journalTitle = '';
      this.journalDescription = '';
      this.journalCoverFile = undefined;
      this.showCreateForm = false;
      this.router.navigate(['/journal', journal.id]);
    } catch (err: any) {
      this.error = err?.error?.message || 'Failed to create journal';
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
      if (this.journalCoverFile) {
        await this.uploadCover(updated.id, this.journalCoverFile);
        updated.cover_url = this.journalCoverFile ? updated.cover_url : updated.cover_url;
      }
      this.journals = this.journals.map(j => (j.id === updated.id ? updated : j));
      this.editingJournalId = undefined;
      this.journalTitle = '';
      this.journalDescription = '';
      this.journalCoverFile = undefined;
      this.showCreateForm = false;
    } catch (err) {
      this.error = 'Failed to update journal';
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
      this.error = 'Failed to delete journal';
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
      this.entries = await firstValueFrom(this.journalsService.getEntries(this.selectedJournalId));
    } catch (err) {
      this.error = 'Failed to load entries';
      console.error(err);
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
      this.error = 'Failed to delete entry';
      console.error(err);
    } finally {
      this.entryLoading = false;
    }
  }

  previewText(entry: JournalEntry): string {
    const text = this.extractText(entry.content_json);
    return text || 'No content yet';
  }

  private extractText(node: any): string {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(n => this.extractText(n)).join(' ');
    if (node.text) return node.text;
    if (node.content) return this.extractText(node.content);
    return '';
  }
}
