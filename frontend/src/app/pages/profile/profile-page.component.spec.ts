import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ProfilePageComponent } from './profile-page.component';
import { ProfileService } from '../../services/profile.service';
import { BrowserNotificationService } from '../../services/notification.service';

describe('ProfilePageComponent', () => {
  let profileService: jasmine.SpyObj<ProfileService>;
  let browserNotifications: jasmine.SpyObj<BrowserNotificationService>;

  beforeEach(async () => {
    profileService = jasmine.createSpyObj('ProfileService', [
      'getProfile',
      'getStreaks',
      'getAchievements',
      'updateProfile',
    ]);
    profileService.getProfile.and.returnValue(of({ id: 1, email: 'user@test.com' } as any));
    profileService.getStreaks.and.returnValue(of({ mood_current: 0, mood_longest: 0, habit_current: 0, habit_longest: 0 } as any));
    profileService.getAchievements.and.returnValue(of({ unlocked: [], all_possible: [] } as any));
    profileService.updateProfile.and.returnValue(of({ id: 1, email: 'new@test.com' } as any));

    browserNotifications = jasmine.createSpyObj('BrowserNotificationService', [
      'getNotificationSettings',
      'updateNotificationSettings',
      'applySettings',
      'requestPermission',
      'sendTestNotification',
      'getNextDailyRun',
    ]);
    browserNotifications.getNotificationSettings.and.returnValue(of({
      mood_reminder_enabled: false,
      mood_reminder_time: '09:00:00',
      habit_reminder_enabled: false,
      habit_reminder_time: '09:00:00',
    } as any));
    browserNotifications.updateNotificationSettings.and.returnValue(of({
      mood_reminder_enabled: true,
      mood_reminder_time: '09:00:00',
      habit_reminder_enabled: false,
      habit_reminder_time: '09:00:00',
    } as any));
    browserNotifications.requestPermission.and.resolveTo('granted');
    browserNotifications.getNextDailyRun.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent, ReactiveFormsModule],
      providers: [
        { provide: ProfileService, useValue: profileService },
        { provide: BrowserNotificationService, useValue: browserNotifications },
      ],
    }).compileComponents();
  });

  it('loads profile data on init', async () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    await component.loadAll();

    expect(profileService.getProfile).toHaveBeenCalled();
    expect(component.profile?.email).toBe('user@test.com');
  });

  it('sets error when load fails', async () => {
    profileService.getProfile.and.returnValue(throwError(() => ({ error: { message: 'Fail' } })));

    const fixture = TestBed.createComponent(ProfilePageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    await component.loadAll();

    expect(component.error).toBe('Fail');
  });

  it('saves profile changes', async () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ email: 'new@test.com', password: 'Password123!' });
    await component.save();

    expect(profileService.updateProfile).toHaveBeenCalled();
    expect(profileService.updateProfile.calls.mostRecent().args[0].email).toBe('new@test.com');
  });

  it('loads notification settings', async () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    await component.loadNotificationSettings();

    expect(browserNotifications.getNotificationSettings).toHaveBeenCalled();
    expect(component.notificationSettings?.mood_reminder_enabled).toBeFalse();
  });

  it('handles reminder toggle flow', async () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.notificationPermission = 'default';
    component.notificationForm.patchValue({ moodEnabled: true });

    await component.handleReminderToggle('mood');

    expect(browserNotifications.requestPermission).toHaveBeenCalled();
    expect(browserNotifications.updateNotificationSettings).toHaveBeenCalled();
  });
});
