import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HabitsPageComponent } from './habits-page.component';
import { HabitService } from '../../services/habit.service';
import { NotificationService } from '../../core/notification.service';
import { ProfileService } from '../../services/profile.service';
import { AchievementCatalogService } from '../../services/achievement-catalog.service';

describe('HabitsPageComponent', () => {
  let habitService: jasmine.SpyObj<HabitService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let profileService: jasmine.SpyObj<ProfileService>;
  let achievements: jasmine.SpyObj<AchievementCatalogService>;

  beforeEach(async () => {
    habitService = jasmine.createSpyObj('HabitService', [
      'getHabits',
      'createHabit',
      'updateHabit',
      'deleteHabit',
      'toggleCompletion',
    ]);
    habitService.getHabits.and.returnValue(of([]));
    habitService.createHabit.and.returnValue(of({
      id: 1,
      title: 'Read',
      frequency: 'daily',
      target_per_week: 7,
      completions: [],
      awarded: [],
    } as any));

    notifications = jasmine.createSpyObj('NotificationService', ['show']);
    profileService = jasmine.createSpyObj('ProfileService', ['getStreaks']);
    profileService.getStreaks.and.returnValue(of({ mood_current: 0, mood_longest: 0, habit_current: 0, habit_longest: 0 } as any));
    achievements = jasmine.createSpyObj('AchievementCatalogService', ['buildToast']);
    achievements.buildToast.and.returnValue({ type: 'success', title: '', message: '', icon: '' } as any);

    await TestBed.configureTestingModule({
      imports: [HabitsPageComponent],
      providers: [
        { provide: HabitService, useValue: habitService },
        { provide: NotificationService, useValue: notifications },
        { provide: ProfileService, useValue: profileService },
        { provide: AchievementCatalogService, useValue: achievements },
      ],
    }).compileComponents();
  });

  it('does not create habit when title is empty', async () => {
    const fixture = TestBed.createComponent(HabitsPageComponent);
    const component = fixture.componentInstance;
    spyOn(component, 'loadHabits').and.returnValue(Promise.resolve());
    fixture.detectChanges();

    component.form.title = '';
    await component.addHabit();

    expect(habitService.createHabit).not.toHaveBeenCalled();
  });

  it('creates habit when title is provided', async () => {
    const fixture = TestBed.createComponent(HabitsPageComponent);
    const component = fixture.componentInstance;
    spyOn(component, 'loadHabits').and.returnValue(Promise.resolve());
    fixture.detectChanges();

    component.form.title = 'Read';
    await component.addHabit();

    expect(habitService.createHabit).toHaveBeenCalled();
  });
});
