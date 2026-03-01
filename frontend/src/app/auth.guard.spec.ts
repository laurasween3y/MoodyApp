import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, isObservable } from 'rxjs';
import { AuthService } from './services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('blocks unauthenticated route', (done) => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: { ensureSession: () => of(false) },
        },
      ],
    });

    TestBed.runInInjectionContext(() => {
      const result = authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
      if (result instanceof UrlTree || result === true || result === false) {
        expect(result instanceof UrlTree).toBeTrue();
        done();
        return;
      }
      if (isObservable(result)) {
        result.subscribe((value: unknown) => {
          expect(value instanceof UrlTree).toBeTrue();
          done();
        });
        return;
      }
      (result as Promise<unknown>).then((value) => {
        expect(value instanceof UrlTree).toBeTrue();
        done();
      });
    });
  });

  it('allows authenticated route', (done) => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: { ensureSession: () => of(true) },
        },
      ],
    });

    TestBed.runInInjectionContext(() => {
      const result = authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
      if (result instanceof UrlTree || result === true || result === false) {
        expect(result).toBeTrue();
        done();
        return;
      }
      if (isObservable(result)) {
        result.subscribe((value: unknown) => {
          expect(value).toBeTrue();
          done();
        });
        return;
      }
      (result as Promise<unknown>).then((value) => {
        expect(value).toBeTrue();
        done();
      });
    });
  });
});
