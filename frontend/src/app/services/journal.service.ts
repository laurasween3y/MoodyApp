import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Observable, map, of, catchError, throwError } from 'rxjs';
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
import { extractAwarded } from '../utils/achievement-utils';
import { OfflineQueueService } from '../core/offline-queue.service';

export interface Journal {
  id: number;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_at?: string;
  updated_at?: string;
  queued?: boolean;
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
  awarded: string[];
  created_at?: string;
  updated_at?: string;
  queued?: boolean;
}

export interface JournalPrompt {
  id: number;
  text: string;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class JournalService {
  constructor(
    private journalsApi: JournalsService,
    private apiConfig: Configuration,
    private http: HttpClient,
    private offlineQueue: OfflineQueueService
  ) {}

  private get apiBase(): string {
    const base = this.apiConfig?.basePath ?? 'http://localhost:5000';
    return base.replace(/\/$/, '');
  }

  getJournals(): Observable<Journal[]> {
    return this.journalsApi.journalsGet().pipe(map((list) => list.map((j) => this.withResolvedCover(j)).filter(Boolean) as Journal[]));
  }

  createJournal(payload: JournalCreate): Observable<Journal> {
    if (!navigator.onLine) {
      const stub = this.enqueueOffline('POST', `${this.apiBase}/journals/`, payload);
      return of(this.normalizeQueuedOrJournal(stub, payload));
    }
    return this.journalsApi.journalsPost(payload).pipe(
      map((j: any) => this.normalizeQueuedOrJournal(j, payload)),
      catchError((err) => {
        if (err?.status === 0 || err?.status === 504) {
          const stub = this.enqueueOffline('POST', `${this.apiBase}/journals/`, payload);
          return of(this.normalizeQueuedOrJournal(stub, payload));
        }
        return throwError(() => err);
      })
    );
  }

  updateJournal(id: number, payload: JournalUpdate): Observable<Journal> {
    if (!navigator.onLine) {
      const stub = this.enqueueOffline('PATCH', `${this.apiBase}/journals/${id}`, payload);
      return of(this.normalizeQueuedOrJournal(stub, payload, id));
    }
    return this.journalsApi.journalsJournalIdPatch(id, payload).pipe(
      map((j: any) => this.normalizeQueuedOrJournal(j, payload, id)),
      catchError((err) => {
        if (err?.status === 0 || err?.status === 504) {
          const stub = this.enqueueOffline('PATCH', `${this.apiBase}/journals/${id}`, payload);
          return of(this.normalizeQueuedOrJournal(stub, payload, id));
        }
        return throwError(() => err);
      })
    );
  }

  getJournal(id: number): Observable<Journal> {
    return this.journalsApi.journalsJournalIdGet(id).pipe(map((j) => this.withResolvedCover(j)));
  }

  uploadCover(id: number, file: File): Observable<Journal> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<JournalResponse>(`${this.apiBase}/journals/${id}/cover`, formData)
      .pipe(map((j) => this.withResolvedCover(j)));
  }

  deleteJournal(id: number): Observable<void> {
    return this.journalsApi.journalsJournalIdDelete(id);
  }

  getRandomPrompt(): Observable<JournalPrompt> {
    return this.http.get<JournalPrompt>(`${this.apiBase}/journal-prompts/random`);
  }

  private normalizeQueuedOrJournal(
    journal: any,
    payload?: JournalCreate | JournalUpdate,
    idOverride?: number
  ): Journal {
    if (journal?.queued) {
      const body = journal?.body ?? payload ?? {};
      return {
        id: journal?.journalId ?? idOverride ?? -1,
        title: body?.title ?? '(queued)',
        description: body?.description ?? null,
        cover_url: null,
        queued: true,
      };
    }
    return this.withResolvedCover(journal as JournalResponse);
  }

  private withResolvedCover(journal: JournalResponse): Journal {
    if (journal.id === undefined) {
      // Skip malformed journal objects
      return null as unknown as Journal;
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
    if (!navigator.onLine) {
      const stub = this.enqueueOffline('POST', `${this.apiBase}/journals/${journalId}/entries`, payload);
      return of(this.normalizeQueuedOrEntry(stub));
    }
    return this.journalsApi.journalsJournalIdEntriesPost(journalId, payload).pipe(
      map((e: any) => this.normalizeQueuedOrEntry(e)),
      catchError((err) => {
        if (err?.status === 0 || err?.status === 504) {
          const stub = this.enqueueOffline('POST', `${this.apiBase}/journals/${journalId}/entries`, payload);
          return of(this.normalizeQueuedOrEntry(stub));
        }
        return throwError(() => err);
      })
    );
  }

  updateEntry(
    journalId: number,
    entryId: number,
    payload: JournalEntryUpdate
  ): Observable<JournalEntry> {
    if (!navigator.onLine) {
      const stub = this.enqueueOffline('PATCH', `${this.apiBase}/journals/${journalId}/entries/${entryId}`, payload);
      return of(this.normalizeQueuedOrEntry(stub));
    }
    return this.journalsApi.journalsJournalIdEntriesEntryIdPatch(journalId, entryId, payload).pipe(
      map((e: any) => this.normalizeQueuedOrEntry(e)),
      catchError((err) => {
        if (err?.status === 0 || err?.status === 504) {
          const stub = this.enqueueOffline('PATCH', `${this.apiBase}/journals/${journalId}/entries/${entryId}`, payload);
          return of(this.normalizeQueuedOrEntry(stub));
        }
        return throwError(() => err);
      })
    );
  }

  deleteEntry(journalId: number, entryId: number): Observable<void> {
    return this.journalsApi.journalsJournalIdEntriesEntryIdDelete(journalId, entryId);
  }

  private normalizeQueuedOrEntry(entry: any): JournalEntry {
    if (entry?.queued) {
      const body = entry?.body ?? {};
      return {
        id: entry?.entryId ?? entry?.id ?? -1,
        journal_id: entry?.journalId ?? body?.journal_id ?? -1,
        title: body?.title ?? entry?.title ?? '(queued)',
        content_json: body?.content_json ?? entry?.content_json ?? null,
        entry_date: body?.entry_date ?? entry?.entry_date ?? '',
        awarded: [],
        queued: true,
      } as JournalEntry;
    }
    return this.normalizeEntry(entry as JournalEntryResponse);
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('moody_access_token');
    if (!token) return new HttpHeaders();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private enqueueOffline(method: string, url: string, body: any) {
    const req = new HttpRequest(method, url, body, { headers: this.authHeaders() });
    this.offlineQueue.enqueue(req);
    return {
      queued: true,
      method,
      url,
      body,
    };
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
      awarded: extractAwarded(entry),
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    };
  }
}
