import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpRequest } from '@angular/common/http';
import { OfflineQueueService } from './offline-queue.service';
import { NotificationService } from './notification.service';

describe('OfflineQueueService', () => {
  let service: OfflineQueueService;
  let httpMock: HttpTestingController;
  let notifications: { show: jasmine.Spy };
  let originalIndexedDb: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalIndexedDb = Object.getOwnPropertyDescriptor(window, 'indexedDB');
    Object.defineProperty(window, 'indexedDB', {
      value: undefined,
      configurable: true,
    });
    localStorage.removeItem('moody_offline_queue_v1');

    notifications = { show: jasmine.createSpy('show') };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OfflineQueueService,
        { provide: NotificationService, useValue: notifications },
      ],
    });

    service = TestBed.inject(OfflineQueueService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
    if (originalIndexedDb) {
      Object.defineProperty(window, 'indexedDB', originalIndexedDb);
    }
    localStorage.removeItem('moody_offline_queue_v1');
  });

  it('adds item when offline', fakeAsync(() => {
    const req = new HttpRequest('POST', '/test', { ok: true });
    service.enqueue(req);
    flushMicrotasks();

    const stored = JSON.parse(localStorage.getItem('moody_offline_queue_v1') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].url).toBe('/test');
  }));

  it('replays when online and clears queue after success', fakeAsync(() => {
    flushMicrotasks();
    const req = new HttpRequest('POST', '/test', { ok: true });
    service.enqueue(req);
    flushMicrotasks();

    const queue = (service as any).queue as any[];
    (service as any).processNext(queue);

    const replayReq = httpMock.expectOne((request) => request.url.endsWith('/test'));
    expect(replayReq.request.method).toBe('POST');
    replayReq.flush({});
    flushMicrotasks();

    const stored = JSON.parse(localStorage.getItem('moody_offline_queue_v1') || '[]');
    expect(stored.length).toBe(0);
    expect(notifications.show).toHaveBeenCalled();
  }));
});
