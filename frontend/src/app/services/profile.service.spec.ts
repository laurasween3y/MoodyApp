import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Configuration } from '../api';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Configuration, useValue: new Configuration({ basePath: 'http://localhost' }) }],
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getProfile calls /profile', () => {
    service.getProfile().subscribe((profile) => {
      expect(profile.email).toBe('user@test.com');
    });

    const req = httpMock.expectOne('http://localhost/profile');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 1, email: 'user@test.com' });
  });

  it('updateProfile calls /profile', () => {
    service.updateProfile({ email: 'new@test.com' }).subscribe((profile) => {
      expect(profile.email).toBe('new@test.com');
    });

    const req = httpMock.expectOne('http://localhost/profile');
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 1, email: 'new@test.com' });
  });

  it('getStreaks calls /progress/streaks', () => {
    service.getStreaks().subscribe((streaks) => {
      expect(streaks.mood_current).toBe(2);
    });

    const req = httpMock.expectOne('http://localhost/progress/streaks');
    expect(req.request.method).toBe('GET');
    req.flush({ mood_current: 2, mood_longest: 4, habit_current: 1, habit_longest: 3 });
  });

  it('getAchievements calls /progress/achievements', () => {
    service.getAchievements().subscribe((payload) => {
      expect(Array.isArray(payload.all_possible)).toBeTrue();
    });

    const req = httpMock.expectOne('http://localhost/progress/achievements');
    expect(req.request.method).toBe('GET');
    req.flush({ unlocked: [], all_possible: [] });
  });
});
