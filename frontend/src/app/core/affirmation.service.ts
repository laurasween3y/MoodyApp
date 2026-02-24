import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

interface AffirmationResponse {
  affirmation: string;
}

@Injectable({ providedIn: 'root' })
export class AffirmationService {
  private url = 'https://www.affirmations.dev';

  constructor(private http: HttpClient) {}

  getAffirmation(): Observable<AffirmationResponse> {
    // Remote API has CORS issues; use a friendly fallback instead.
    return of({ affirmation: "You're doing better than you think 💛" });
  }
}
