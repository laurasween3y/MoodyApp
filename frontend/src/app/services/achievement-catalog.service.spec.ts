import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AchievementCatalogService } from './achievement-catalog.service';
import { ProgressService } from '../api';

describe('AchievementCatalogService', () => {
  let service: AchievementCatalogService;
  let progressApi: jasmine.SpyObj<ProgressService>;

  beforeEach(() => {
    progressApi = jasmine.createSpyObj('ProgressService', ['progressAchievementsGet']);
    progressApi.progressAchievementsGet.and.returnValue(of({
      all_possible: [
        {
          key: 'mood_first_log',
          title: 'First Check-in',
          description: 'Log your first mood',
          icon: '/assets/achievements/firstmood.png',
        },
      ],
      unlocked: [],
    } as any));

    TestBed.configureTestingModule({
      providers: [
        AchievementCatalogService,
        { provide: ProgressService, useValue: progressApi },
      ],
    });

    service = TestBed.inject(AchievementCatalogService);
  });

  it('loads meta map from API', (done) => {
    service.ensureLoaded().subscribe((map) => {
      expect(map['mood_first_log']).toBeTruthy();
      expect(map['mood_first_log'].title).toBe('First Check-in');
      done();
    });
  });

  it('returns fallback toast when key missing', () => {
    const toast = service.buildToast('missing_key');
    expect(toast.title).toBe('New badge unlocked');
  });

  it('handles API error by returning cached map', (done) => {
    progressApi.progressAchievementsGet.and.returnValue(throwError(() => new Error('fail')));

    service.ensureLoaded().subscribe((map) => {
      expect(map).toBeTruthy();
      done();
    });
  });
});
