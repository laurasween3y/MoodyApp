import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  Configuration,
  JournalCreate,
  JournalEntryCreate,
  JournalEntryResponse,
  JournalEntryUpdate,
  JournalResponse,
  JournalUpdate,
  JournalsService
} from '../api';

export interface Journal {
  id: number;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JournalEntry {
  id: number;
  journal_id: number;
  title: string | null;
  content_json: object | null;
  background?: string;
  font_family?: string;
  font_size?: number;
  entry_date: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class JournalService {
  constructor(private journalsApi: JournalsService, private apiConfig: Configuration) {}

  private get apiBase(): string {
    const base = this.apiConfig?.basePath ?? 'http://localhost:5000';
    return base.replace(/\/$/, '');
  }

  getJournals(): Observable<Journal[]> {
    return this.journalsApi.journalsGet().pipe(map((list) => list.map((j) => this.withResolvedCover(j))));
  }

  createJournal(payload: JournalCreate): Observable<Journal> {
    return this.journalsApi.journalsPost(payload).pipe(map((j) => this.withResolvedCover(j)));
  }

  updateJournal(id: number, payload: JournalUpdate): Observable<Journal> {
    return this.journalsApi.journalsJournalIdPatch(id, payload).pipe(map((j) => this.withResolvedCover(j)));
  }

  uploadCover(id: number, file: File): Observable<Journal> {
    return this.journalsApi.journalsJournalIdCoverPost(id, file).pipe(map((j) => this.withResolvedCover(j)));
  }

  deleteJournal(id: number): Observable<void> {
    return this.journalsApi.journalsJournalIdDelete(id);
  }

  private withResolvedCover(journal: JournalResponse): Journal {
    if (journal.id === undefined) {
      throw new Error('Journal id is required');
    }
    const normalized: Journal = {
      id: journal.id,
      title: journal.title ?? '',
      description: journal.description ?? null,
      cover_url: journal.cover_url ?? null,
      created_at: journal.created_at,
      updated_at: journal.updated_at,
    };

    if (normalized.cover_url && normalized.cover_url.startsWith('/')) {
      normalized.cover_url = `${this.apiBase}${normalized.cover_url}`;
    }
    return normalized;
  }

  getEntries(journalId: number): Observable<JournalEntry[]> {
    return this.journalsApi.journalsJournalIdEntriesGet(journalId).pipe(map((list) => list.map((e) => this.normalizeEntry(e))));
  }

  getEntry(journalId: number, entryId: number): Observable<JournalEntry> {
    return this.journalsApi.journalsJournalIdEntriesEntryIdGet(journalId, entryId).pipe(map((e) => this.normalizeEntry(e)));
  }

  createEntry(
    journalId: number,
    payload: JournalEntryCreate
  ): Observable<JournalEntry> {
    return this.journalsApi.journalsJournalIdEntriesPost(journalId, payload).pipe(map((e) => this.normalizeEntry(e)));
  }

  updateEntry(
    journalId: number,
    entryId: number,
    payload: JournalEntryUpdate
  ): Observable<JournalEntry> {
    return this.journalsApi.journalsJournalIdEntriesEntryIdPatch(journalId, entryId, payload).pipe(map((e) => this.normalizeEntry(e)));
  }

  deleteEntry(journalId: number, entryId: number): Observable<void> {
    return this.journalsApi.journalsJournalIdEntriesEntryIdDelete(journalId, entryId);
  }

  private normalizeEntry(entry: JournalEntryResponse): JournalEntry {
    if (entry.id === undefined || entry.journal_id === undefined) {
      throw new Error('Journal entry id and journal_id are required');
    }
    return {
      id: entry.id,
      journal_id: entry.journal_id,
      title: entry.title ?? null,
      content_json: entry.content_json ?? null,
      background: entry.background,
      font_family: entry.font_family,
      font_size: entry.font_size,
      entry_date: entry.entry_date ?? '',
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    };
  }
}
