import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MoodPageComponent } from './mood-page.component';
import { MoodsService } from '../../api';
import { NotificationService } from '../../core/notification.service';
import { ProfileService } from '../../services/profile.service';
import { AchievementCatalogService } from '../../services/achievement-catalog.service';

describe('MoodPageComponent', () => {
  let moodsService: jasmine.SpyObj<MoodsService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let profileService: jasmine.SpyObj<ProfileService>;
  let achievements: jasmine.SpyObj<AchievementCatalogService>;

  beforeEach(async () => {
    moodsService = jasmine.createSpyObj('MoodsService', [
      'moodsOptionsGet',
      'moodsTodayGet',
      'moodsGet',
      'moodsPost',
      'moodsMoodIdPatch',
      'moodsMoodIdDelete',
    ]) as jasmine.SpyObj<MoodsService>;
    (moodsService.moodsOptionsGet as any).and.returnValue(of({ options: ['happy'] } as any));
    (moodsService.moodsTodayGet as any).and.returnValue(of({} as any));
    (moodsService.moodsGet as any).and.returnValue(of([] as any));
    (moodsService.moodsPost as any).and.returnValue(of({ id: 1, mood: 'happy', date: '2026-03-01', awarded: [] } as any));

    notifications = jasmine.createSpyObj('NotificationService', ['show']);
    profileService = jasmine.createSpyObj('ProfileService', ['getStreaks']);
    profileService.getStreaks.and.returnValue(of({ mood_current: 0, mood_longest: 0, habit_current: 0, habit_longest: 0 } as any));

    achievements = jasmine.createSpyObj('AchievementCatalogService', ['buildToast']);
    achievements.buildToast.and.returnValue({ type: 'success', title: '', message: '', icon: '' } as any);

    await TestBed.configureTestingModule({
      imports: [MoodPageComponent],
      providers: [
        { provide: MoodsService, useValue: moodsService },
        { provide: NotificationService, useValue: notifications },
        { provide: ProfileService, useValue: profileService },
        { provide: AchievementCatalogService, useValue: achievements },
      ],
    }).compileComponents();
  });

  it('sets error when saving without selecting a mood', async () => {
    const fixture = TestBed.createComponent(MoodPageComponent);
    const component = fixture.componentInstance;
    spyOn<any>(component, 'refreshData').and.returnValue(Promise.resolve());
    fixture.detectChanges();

    component.selectedMood = undefined;
    await component.saveMood();

    expect(component.error).toBe('Pick a mood to continue');
  });

  it('calls moodsPost when saving a new mood', async () => {
    const fixture = TestBed.createComponent(MoodPageComponent);
    const component = fixture.componentInstance;
    spyOn<any>(component, 'refreshData').and.returnValue(Promise.resolve());
    fixture.detectChanges();

    component.selectedMood = 'happy';
    await component.saveMood();

    expect(moodsService.moodsPost).toHaveBeenCalled();
  });

  it('sets error when saveMood fails', async () => {
    (moodsService.moodsPost as any).and.returnValue(
      throwError(() => ({ error: { message: 'Failed to save mood' } }))
    );

    const fixture = TestBed.createComponent(MoodPageComponent);
    const component = fixture.componentInstance;
    spyOn<any>(component, 'refreshData').and.returnValue(Promise.resolve());
    fixture.detectChanges();

    component.selectedMood = 'happy';
    await component.saveMood();

    expect(component.error).toBe('Failed to save mood');
  });
});
