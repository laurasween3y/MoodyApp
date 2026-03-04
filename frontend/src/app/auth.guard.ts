// Route guard using a session check instead of stored token only.
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureSession().pipe(
    map((isLoggedIn) => (isLoggedIn ? true : router.createUrlTree(['/login'])))
  );
};
