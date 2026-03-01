import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Configuration } from './configuration';
import { PlannerService } from './api/planner.service';

describe('PlannerService', () => {
  let service: PlannerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Configuration, useValue: new Configuration({ basePath: 'http://localhost' }) }],
    });
    service = TestBed.inject(PlannerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('create planner event', () => {
    service.plannerEventsPost({ title: 'Study', event_date: '2026-03-01' } as any).subscribe((res) => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne('http://localhost/planner/events');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, title: 'Study', event_date: '2026-03-01' });
  });

  it('delete planner event', () => {
    service.plannerEventsEventIdDelete(10).subscribe((res) => {
      expect(res === undefined || res === null).toBeTrue();
    });

    const req = httpMock.expectOne('http://localhost/planner/events/10');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('error handling', () => {
    service.plannerEventsPost({ title: 'Study', event_date: '2026-03-01' } as any).subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpMock.expectOne('http://localhost/planner/events');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Error' });
  });
});
