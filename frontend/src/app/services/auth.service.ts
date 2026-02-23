import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  AuthService as AuthApiService,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse
} from '../api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'moody_access_token';
  private readonly _isLoggedIn$ = new BehaviorSubject<boolean>(this.hasValidStoredToken());

  constructor(private authApi: AuthApiService, private router: Router) {
    this.getValidToken();
  }

  isLoggedIn$(): Observable<boolean> {
    return this._isLoggedIn$.asObservable();
  }

  isLoggedIn(): boolean {
    return this._isLoggedIn$.value;
  }

  get token(): string | null {
    return this.getValidToken();
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.authApi.authLoginPost(payload).pipe(
      tap((res) => {
        if (res?.access_token) {
          this.setToken(res.access_token);
        }
      })
    );
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.authApi.authRegisterPost(payload);
  }

  logout(redirect = true): void {
    this.clearToken();
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  private setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    this._isLoggedIn$.next(true);
  }

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private hasValidStoredToken(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  private getValidToken(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    if (this.isTokenExpired(token)) {
      this.clearToken();
      this.router.navigate(['/login']);
      return null;
    }
    return token;
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);
    if (!payload?.exp) {
      return true;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSeconds;
  }

  private decodeTokenPayload(token: string): { exp?: number } | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(base64);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    this._isLoggedIn$.next(false);
  }
}
