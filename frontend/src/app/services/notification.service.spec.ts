import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Configuration } from '../api';
import { BrowserNotificationService } from './notification.service';
import { NotificationService as AppNotificationService } from '../core/notification.service';

class NotificationMock {
  static permission: NotificationPermission = 'default';
  static requestPermission = jasmine.createSpy('requestPermission').and.resolveTo('granted');
  constructor(public title: string, public options?: NotificationOptions) {}
}

describe('BrowserNotificationService', () => {
  let service: BrowserNotificationService;
  let httpMock: HttpTestingController;
  let appNotifications: { show: jasmine.Spy };
  let originalNotification: any;

  beforeEach(() => {
    appNotifications = { show: jasmine.createSpy('show') };

    originalNotification = (window as any).Notification;
    (window as any).Notification = NotificationMock as any;
    (window as any).Notification.permission = 'granted';

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AppNotificationService, useValue: appNotifications },
        { provide: Configuration, useValue: new Configuration({ basePath: 'http://localhost' }) },
        BrowserNotificationService,
      ],
    });

    service = TestBed.inject(BrowserNotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    (window as any).Notification = originalNotification;
  });

  it('getNotificationSettings calls API', () => {
    service.getNotificationSettings().subscribe((res) => {
      expect(res.mood_reminder_enabled).toBeFalse();
    });

    const req = httpMock.expectOne('http://localhost/notification-settings');
    expect(req.request.method).toBe('GET');
    req.flush({
      mood_reminder_enabled: false,
      mood_reminder_time: null,
      habit_reminder_enabled: false,
      habit_reminder_time: null,
    });
  });

  it('updateNotificationSettings calls API', () => {
    service.updateNotificationSettings({ mood_reminder_enabled: true }).subscribe((res) => {
      expect(res.mood_reminder_enabled).toBeTrue();
    });

    const req = httpMock.expectOne('http://localhost/notification-settings');
    expect(req.request.method).toBe('PUT');
    req.flush({
      mood_reminder_enabled: true,
      mood_reminder_time: '09:00:00',
      habit_reminder_enabled: false,
      habit_reminder_time: null,
    });
  });

  it('requestPermission returns granted when already granted', async () => {
    (window as any).Notification.permission = 'granted';
    const result = await service.requestPermission();
    expect(result).toBe('granted');
  });

  it('sendTestNotification triggers in-app and browser notification', () => {
    service.sendTestNotification();
    expect(appNotifications.show).toHaveBeenCalled();
  });
});
