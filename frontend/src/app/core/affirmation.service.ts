import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface AffirmationResponse {
  affirmation: string;
}

@Injectable({ providedIn: 'root' })
export class AffirmationService {
  private url = 'https://www.affirmations.dev';

  constructor(private http: HttpClient) {}

  getAffirmation(): Observable<AffirmationResponse> {
    return this.http.get<AffirmationResponse>(this.url, {
      headers: { Accept: 'application/json' },
    });
  }
}
