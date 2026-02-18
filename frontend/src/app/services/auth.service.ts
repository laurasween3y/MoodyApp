import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthService as AuthApiService, Login, LoginResponse, Register, RegisterResponse } from '../api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'moody_access_token';
  private readonly _isLoggedIn$ = new BehaviorSubject<boolean>(!!this.getToken());

  constructor(private authApi: AuthApiService) {}

  isLoggedIn$(): Observable<boolean> {
    return this._isLoggedIn$.asObservable();
  }

  isLoggedIn(): boolean {
    return this._isLoggedIn$.value;
  }

  get token(): string | null {
    return this.getToken();
  }

  login(payload: Login): Observable<LoginResponse> {
    return this.authApi.authLoginPost(payload).pipe(
      tap((res) => {
        if (res?.access_token) {
          this.setToken(res.access_token);
        }
      })
    );
  }

  register(payload: Register): Observable<RegisterResponse> {
    return this.authApi.authRegisterPost(payload);
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
