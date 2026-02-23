import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppNotification, NotificationService } from '../core/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast" *ngIf="notification" [attr.data-type]="notification.type" role="status" aria-live="polite">
      <div class="toast-icon" *ngIf="notification.iconUrl; else emojiIcon">
        <img [src]="notification.iconUrl" [alt]="notification.title" />
      </div>
      <ng-template #emojiIcon>
        <div class="toast-icon emoji" *ngIf="notification.icon">{{ notification.icon }}</div>
      </ng-template>
      <div class="toast-content">
        <div class="toast-title">{{ notification.title }}</div>
        <div class="toast-message">{{ notification.message }}</div>
      </div>
    </div>
  `,
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnDestroy {
  notification?: AppNotification;
  private timeoutId?: ReturnType<typeof setTimeout>;
  private subscription: Subscription;

  constructor(private notifications: NotificationService) {
    this.subscription = this.notifications.notifications$.subscribe((note) => {
      this.notification = note;
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this.notification = undefined;
      }, 4200);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
