// Auth helper between UI and generated API client; stores token and checks session.
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, finalize, map, of, tap } from 'rxjs';
import {
  AuthService as AuthApiService,
  LoginRequest,
  LoginResponse,
  ProfileService as ProfileApiService,
  RegisterRequest,
  RegisterResponse
} from '../api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'moody_access_token';
  private readonly _isLoggedIn$ = new BehaviorSubject<boolean>(!!this.getToken());
  private sessionCheck$: Observable<boolean> | null = null;

  constructor(
    private authApi: AuthApiService,
    private profileApi: ProfileApiService,
    private router: Router
  ) {}

  isLoggedIn$(): Observable<boolean> {
    return this._isLoggedIn$.asObservable();
  }

  isLoggedIn(): boolean {
    return this._isLoggedIn$.value;
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.authApi.authLoginPost(payload).pipe(
      tap((res) => {
        if ((res as any)?.access_token) {
          this.setToken((res as any).access_token);
        }
        this._isLoggedIn$.next(true);
      })
    );
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.authApi.authRegisterPost(payload);
  }

  logout(redirect = true): void {
    this.authApi.authLogoutPost().subscribe({
      next: () => this.clearSession(redirect),
      error: () => this.clearSession(redirect),
    });
  }

  ensureSession(): Observable<boolean> {
    if (this._isLoggedIn$.value) {
      return of(true);
    }

    // If there is no stored token, short‑circuit to avoid a noisy /profile call
    const token = this.getToken();
    if (!token) {
      this._isLoggedIn$.next(false);
      return of(false);
    }

    if (this.sessionCheck$) {
      return this.sessionCheck$;
    }

    this.sessionCheck$ = this.profileApi.profileGet().pipe(
      map(() => true),
      catchError(() => of(false)),
      tap((isLoggedIn) => this._isLoggedIn$.next(isLoggedIn)),
      finalize(() => {
        this.sessionCheck$ = null;
      })
    );

    return this.sessionCheck$;
  }

  private clearSession(redirect: boolean): void {
    this._isLoggedIn$.next(false);
    this.clearToken();
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  private setToken(token: string): void {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch {
      /* ignore */
    }
  }

  private clearToken(): void {
    try {
      localStorage.removeItem(this.tokenKey);
    } catch {
      /* ignore */
    }
  }
}
