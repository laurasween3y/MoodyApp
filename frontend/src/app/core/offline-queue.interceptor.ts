// Queue write requests offline and replay later; return 202 stubs.
import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of, catchError, throwError } from 'rxjs';
import { OfflineQueueService } from './offline-queue.service';
import { NotificationService } from './notification.service';

const isWriteMethod = (method: string) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

const extractIds = (url: string) => {
  const ids: {
    habitId?: number;
    journalId?: number;
    entryId?: number;
    eventId?: number;
    moodId?: number;
  } = {};
  const habitMatch = url.match(/\/habits\/(\d+)/);
  if (habitMatch) ids.habitId = Number(habitMatch[1]);

  const journalMatch = url.match(/\/journals\/(\d+)/);
  if (journalMatch) ids.journalId = Number(journalMatch[1]);

  const entryMatch = url.match(/\/journals\/\d+\/entries\/(\d+)/);
  if (entryMatch) ids.entryId = Number(entryMatch[1]);

  const plannerMatch = url.match(/\/planner\/events\/(\d+)/);
  if (plannerMatch) ids.eventId = Number(plannerMatch[1]);

  const moodMatch = url.match(/\/moods\/(\d+)/);
  if (moodMatch) ids.moodId = Number(moodMatch[1]);

  return ids;
};

export const offlineQueueInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const queue = inject(OfflineQueueService);
  const notifications = inject(NotificationService);

  const buildStub = () => ({
    queued: true,
    method: req.method,
    url: req.url,
    body: req.body,
    ...extractIds(req.url),
  });

  const enqueueAndStub = () => {
    queue.enqueue(req);
    notifications.show({
      type: 'info',
      title: 'Saved offline',
      message: 'We will sync this once you are back online.',
      icon: '🛰️'
    });
    return of(new HttpResponse({ status: 202, body: buildStub() }));
  };

  if (!isWriteMethod(req.method)) {
    return next(req);
  }

  if (!navigator.onLine) {
    return enqueueAndStub();
  }

  return next(req).pipe(
    catchError((err) => {
      if (err?.status === 0 || err?.status === 504) {
        return enqueueAndStub();
      }
      return throwError(() => err);
    })
  );
};
