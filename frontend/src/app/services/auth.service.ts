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
  private readonly _isLoggedIn$ = new BehaviorSubject<boolean>(false);
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
      tap(() => {
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
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }
}
