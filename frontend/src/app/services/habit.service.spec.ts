import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HabitService } from './habit.service';
import { Configuration } from '../api';

describe('HabitService', () => {
  let service: HabitService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Configuration, useValue: new Configuration({ basePath: 'http://localhost' }) }],
    });
    service = TestBed.inject(HabitService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('create habit', () => {
    service.createHabit({ title: 'Read', frequency: 'daily', target_per_week: 7 }).subscribe((habit) => {
      expect(habit.title).toBe('Read');
      expect(habit.id).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost/habits/');
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 1,
      title: 'Read',
      frequency: 'daily',
      target_per_week: 7,
      completions: [],
      awarded: [],
    });
  });

  it('toggle completion', () => {
    service.toggleCompletion(3, '2026-03-01').subscribe((habit) => {
      expect(habit.completions.length).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost/habits/3/toggle');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.date).toBe('2026-03-01');
    req.flush({
      id: 3,
      title: 'Water',
      frequency: 'daily',
      target_per_week: 7,
      completions: ['2026-03-01'],
      awarded: [],
    });
  });

  it('delete habit', () => {
    service.deleteHabit(5).subscribe((res) => {
      expect(res === undefined || res === null).toBeTrue();
    });

    const req = httpMock.expectOne('http://localhost/habits/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('error case handling', () => {
    service.createHabit({ title: 'Bad', frequency: 'daily', target_per_week: 7 }).subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpMock.expectOne('http://localhost/habits/');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Error' });
  });
});
