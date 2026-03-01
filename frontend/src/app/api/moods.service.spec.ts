import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Configuration } from './configuration';
import { MoodsService } from './api/moods.service';

describe('MoodsService', () => {
  let service: MoodsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Configuration, useValue: new Configuration({ basePath: 'http://localhost' }) }],
    });

    service = TestBed.inject(MoodsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('create mood request', () => {
    service.moodsPost({ mood: 'happy', note: 'ok' }).subscribe((res) => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne('http://localhost/moods/');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, mood: 'happy', note: 'ok', date: '2026-03-01' });
  });

  it('update mood', () => {
    service.moodsMoodIdPatch(1, { mood: 'sad' }).subscribe((res) => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne('http://localhost/moods/1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 1, mood: 'sad', date: '2026-03-01' });
  });

  it('error handling for duplicate mood', () => {
    service.moodsPost({ mood: 'happy', date: '2026-03-01' }).subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err.status).toBe(409);
      },
    });

    const req = httpMock.expectOne('http://localhost/moods/');
    req.flush({ message: 'Mood already exists' }, { status: 409, statusText: 'Conflict' });
  });
});
