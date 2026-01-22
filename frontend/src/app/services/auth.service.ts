import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface LoginResponse {
  access_token: string;
}

interface RegisterRequest {
  email: string;
  password: string;
}

interface LoginRequest extends RegisterRequest {}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'moody_access_token';
  private readonly apiBase = 'http://localhost:5000';
  private readonly _isLoggedIn$ = new BehaviorSubject<boolean>(!!this.getToken());

  constructor(private http: HttpClient) {}

  isLoggedIn$(): Observable<boolean> {
    return this._isLoggedIn$.asObservable();
  }

  isLoggedIn(): boolean {
    return this._isLoggedIn$.value;
  }

  get token(): string | null {
    return this.getToken();
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiBase}/auth/login`, payload)
      .pipe(tap((res) => this.setToken(res.access_token)));
  }

  register(payload: RegisterRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiBase}/auth/register`, payload);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this._isLoggedIn$.next(false);
  }

  private setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    this._isLoggedIn$.next(true);
  }

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
