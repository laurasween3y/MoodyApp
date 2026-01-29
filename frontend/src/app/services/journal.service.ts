import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Journal {
  id: number;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JournalEntry {
  id: number;
  journal_id: number;
  title?: string | null;
  content_json: any;
  background: string;
  font_family: string;
  font_size: number;
  entry_date: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class JournalService {
  private readonly apiBase = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  getJournals(): Observable<Journal[]> {
    return this.http.get<Journal[]>(`${this.apiBase}/journals/`).pipe(map(list => list.map(j => this.withResolvedCover(j))));
  }

  createJournal(payload: { title: string; description?: string | null }): Observable<Journal> {
    return this.http.post<Journal>(`${this.apiBase}/journals/`, payload).pipe(map(j => this.withResolvedCover(j)));
  }

  updateJournal(id: number, payload: Partial<{ title: string; description?: string | null }>): Observable<Journal> {
    return this.http.patch<Journal>(`${this.apiBase}/journals/${id}`, payload).pipe(map(j => this.withResolvedCover(j)));
  }

  uploadCover(id: number, file: File): Observable<Journal> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Journal>(`${this.apiBase}/journals/${id}/cover`, formData).pipe(map(j => this.withResolvedCover(j)));
  }

  deleteJournal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/journals/${id}`);
  }

  private withResolvedCover(journal: Journal): Journal {
    if (journal?.cover_url && journal.cover_url.startsWith('/')) {
      return { ...journal, cover_url: `${this.apiBase}${journal.cover_url}` };
    }
    return journal;
  }

  getEntries(journalId: number): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(`${this.apiBase}/journals/${journalId}/entries`);
  }

  getEntry(journalId: number, entryId: number): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`${this.apiBase}/journals/${journalId}/entries/${entryId}`);
  }

  createEntry(
    journalId: number,
    payload: {
      title?: string | null;
      content_json: any;
      background?: string;
      font_family?: string;
      font_size?: number;
      entry_date?: string;
    }
  ): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(`${this.apiBase}/journals/${journalId}/entries`, payload);
  }

  updateEntry(
    journalId: number,
    entryId: number,
    payload: Partial<{
      title?: string | null;
      content_json: any;
      background?: string;
      font_family?: string;
      font_size?: number;
      entry_date?: string;
    }>
  ): Observable<JournalEntry> {
    return this.http.patch<JournalEntry>(`${this.apiBase}/journals/${journalId}/entries/${entryId}`, payload);
  }

  deleteEntry(journalId: number, entryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/journals/${journalId}/entries/${entryId}`);
  }
}
