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

export type Journal = JournalResponse;
export type JournalEntry = JournalEntryResponse;

@Injectable({ providedIn: 'root' })
export class JournalService {
  constructor(private journalsApi: JournalsService, private apiConfig: Configuration) {}

  private get apiBase(): string {
    const base = this.apiConfig?.basePath ?? 'http://localhost:5000';
    return base.replace(/\/$/, '');
  }

  getJournals(): Observable<JournalResponse[]> {
    return this.journalsApi.journalsGet().pipe(map((list) => list.map((j) => this.withResolvedCover(j))));
  }

  createJournal(payload: JournalCreate): Observable<JournalResponse> {
    return this.journalsApi.journalsPost(payload).pipe(map((j) => this.withResolvedCover(j)));
  }

  updateJournal(id: number, payload: JournalUpdate): Observable<JournalResponse> {
    return this.journalsApi.journalsJournalIdPatch(id, payload).pipe(map((j) => this.withResolvedCover(j)));
  }

  uploadCover(id: number, file: File): Observable<JournalResponse> {
    return this.journalsApi.journalsJournalIdCoverPost(id, file).pipe(map((j) => this.withResolvedCover(j)));
  }

  deleteJournal(id: number): Observable<void> {
    return this.journalsApi.journalsJournalIdDelete(id);
  }

  private withResolvedCover(journal: JournalResponse): JournalResponse {
    if (journal?.cover_url && journal.cover_url.startsWith('/')) {
      return { ...journal, cover_url: `${this.apiBase}${journal.cover_url}` };
    }
    return journal;
  }

  getEntries(journalId: number): Observable<JournalEntryResponse[]> {
    return this.journalsApi.journalsJournalIdEntriesGet(journalId);
  }

  getEntry(journalId: number, entryId: number): Observable<JournalEntryResponse> {
    return this.journalsApi.journalsJournalIdEntriesEntryIdGet(journalId, entryId);
  }

  createEntry(
    journalId: number,
    payload: JournalEntryCreate
  ): Observable<JournalEntryResponse> {
    return this.journalsApi.journalsJournalIdEntriesPost(journalId, payload);
  }

  updateEntry(
    journalId: number,
    entryId: number,
    payload: JournalEntryUpdate
  ): Observable<JournalEntryResponse> {
    return this.journalsApi.journalsJournalIdEntriesEntryIdPatch(journalId, entryId, payload);
  }

  deleteEntry(journalId: number, entryId: number): Observable<void> {
    return this.journalsApi.journalsJournalIdEntriesEntryIdDelete(journalId, entryId);
  }
}
