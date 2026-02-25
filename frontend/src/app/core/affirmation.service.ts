import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { Configuration } from '../api';

interface AffirmationResponse {
  affirmation: string;
}

@Injectable({ providedIn: 'root' })
export class AffirmationService {
  private fallback = "You're doing better than you think 💛";
  private storageKey = 'moody:affirmation:daily';

  constructor(private http: HttpClient, private apiConfig: Configuration) {}

  private get apiBase(): string {
    const base = this.apiConfig?.basePath ?? 'http://localhost:5000';
    return base.replace(/\/$/, '');
  }

  getAffirmation(): Observable<AffirmationResponse> {
    const cached = this.getCachedAffirmation();
    if (cached) {
      return of({ affirmation: cached });
    }

    if (!navigator.onLine) {
      const offlineAffirmation = this.fallback;
      this.storeAffirmation(offlineAffirmation);
      return of({ affirmation: offlineAffirmation });
    }

    return this.http.get<AffirmationResponse>(`${this.apiBase}/affirmations/`).pipe(
      map((res) => {
        const affirmation = res?.affirmation?.trim() || this.fallback;
        this.storeAffirmation(affirmation);
        return { affirmation };
      }),
      catchError(() => {
        const fallback = this.fallback;
        this.storeAffirmation(fallback);
        return of({ affirmation: fallback });
      })
    );
  }

  private getCachedAffirmation(): string | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { date: string; affirmation: string };
      if (parsed?.date === this.getTodayKey() && parsed?.affirmation) {
        return parsed.affirmation;
      }
    } catch {
      return null;
    }
    return null;
  }

  private storeAffirmation(affirmation: string): void {
    const payload = { date: this.getTodayKey(), affirmation };
    localStorage.setItem(this.storageKey, JSON.stringify(payload));
  }

  private getTodayKey(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
