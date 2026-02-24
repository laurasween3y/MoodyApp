import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { OfflineQueueService } from './offline-queue.service';
import { NotificationService } from './notification.service';

const isWriteMethod = (method: string) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

export const offlineQueueInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  if (navigator.onLine || !isWriteMethod(req.method)) {
    return next(req);
  }

  const queue = inject(OfflineQueueService);
  const notifications = inject(NotificationService);

  queue.enqueue(req);
  notifications.show({
    type: 'info',
    title: 'Saved offline',
    message: 'We will sync this once you are back online.',
    icon: '🛰️'
  });

  const stub = { queued: true, method: req.method, url: req.url };
  return of(new HttpResponse({ status: 202, body: stub }));
};
