import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { Configuration } from '../api';

const makeConfig = () => new Configuration({ basePath: 'http://localhost' });

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: Configuration, useFactory: makeConfig }],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('login success (mock 200)', () => {
    service.login({ email: 'a@test.com', password: 'Password123!' }).subscribe((res) => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne('http://localhost/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Login successful' });

    expect(service.isLoggedIn()).toBeTrue();
  });

  it('login failure (mock 401)', () => {
    service.login({ email: 'a@test.com', password: 'wrong' }).subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err.status).toBe(401);
      },
    });

    const req = httpMock.expectOne('http://localhost/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.isLoggedIn()).toBeFalse();
  });

  it('logout clears state', () => {
    service.login({ email: 'a@test.com', password: 'Password123!' }).subscribe();
    const loginReq = httpMock.expectOne('http://localhost/auth/login');
    loginReq.flush({ message: 'Login successful' });
    expect(service.isLoggedIn()).toBeTrue();

    service.logout(false);
    const logoutReq = httpMock.expectOne('http://localhost/auth/logout');
    expect(logoutReq.request.method).toBe('POST');
    logoutReq.flush({ message: 'Logged out' });

    expect(service.isLoggedIn()).toBeFalse();
  });
});
