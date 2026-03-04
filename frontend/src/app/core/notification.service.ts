// In-app notification bus.
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type NotificationType = 'success' | 'achievement' | 'error' | 'info';

export interface AppNotification {
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  iconUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new Subject<AppNotification>();
  notifications$ = this.notificationSubject.asObservable();

  show(notification: AppNotification) {
    this.notificationSubject.next(notification);
  }
}
