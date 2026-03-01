import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PlannerPageComponent } from './planner-page.component';
import { PlannerService } from '../../api';
import { NotificationService } from '../../core/notification.service';
import { BrowserNotificationService } from '../../services/notification.service';
import { AchievementCatalogService } from '../../services/achievement-catalog.service';

describe('PlannerPageComponent', () => {
  let plannerService: jasmine.SpyObj<PlannerService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let browserNotifications: jasmine.SpyObj<BrowserNotificationService>;
  let achievements: jasmine.SpyObj<AchievementCatalogService>;

  beforeEach(async () => {
    plannerService = jasmine.createSpyObj('PlannerService', [
      'plannerEventsGet',
      'plannerEventsPost',
      'plannerEventsEventIdPut',
      'plannerEventsEventIdDelete',
    ]);
    (plannerService.plannerEventsGet as any).and.returnValue(of([] as any));

    notifications = jasmine.createSpyObj('NotificationService', ['show']);
    browserNotifications = jasmine.createSpyObj('BrowserNotificationService', [
      'schedulePlannerReminders',
    ]);
    achievements = jasmine.createSpyObj('AchievementCatalogService', ['buildToast']);
    achievements.buildToast.and.returnValue({ type: 'success', title: '', message: '', icon: '' } as any);

    await TestBed.configureTestingModule({
      imports: [PlannerPageComponent],
      providers: [
        { provide: PlannerService, useValue: plannerService },
        { provide: NotificationService, useValue: notifications },
        { provide: BrowserNotificationService, useValue: browserNotifications },
        { provide: AchievementCatalogService, useValue: achievements },
      ],
    }).compileComponents();
  });

  it('sets error when loadEvents fails', async () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    plannerService.plannerEventsGet.and.returnValue(
      throwError(() => ({ error: { message: 'Failed to load events' } }))
    );

    const fixture = TestBed.createComponent(PlannerPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    await component.loadEvents();

    expect(component.error).toBe('Failed to load events');
  });

  it('sets error when create event fails', async () => {
    plannerService.plannerEventsPost.and.returnValue(
      throwError(() => ({ error: { message: 'Failed to create event' } }))
    );

    const fixture = TestBed.createComponent(PlannerPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.title = 'Study';
    await component.saveEvent();

    expect(component.error).toBe('Failed to create event');
  });

  it('sets error when delete event fails', async () => {
    (plannerService.plannerEventsGet as any).and.returnValue(of([{ id: 1, title: 'Event' } as any] as any));
    plannerService.plannerEventsEventIdDelete.and.returnValue(
      throwError(() => ({ error: { message: 'Failed to delete event' } }))
    );

    const fixture = TestBed.createComponent(PlannerPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    await component.deleteEvent({ id: 1, title: 'Event' } as any);

    expect(component.error).toBe('Failed to delete event');
  });
});
