import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { NotificationService } from './notification.service';

interface QueuedRequest {
  url: string;
  method: string;
  body: any;
  headers: Record<string, string>;
  withCredentials: boolean;
}

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private readonly storageKey = 'moody_offline_queue_v1';
  private draining = false;

  constructor(private http: HttpClient, private notifications: NotificationService) {
    window.addEventListener('online', () => this.drain());
  }

  enqueue(req: HttpRequest<any>) {
    const headers: Record<string, string> = {};
    req.headers.keys().forEach((k) => {
      headers[k] = req.headers.get(k) ?? '';
    });

    const stored: QueuedRequest[] = this.loadQueue();
    stored.push({
      url: req.url,
      method: req.method,
      body: req.body,
      headers,
      withCredentials: req.withCredentials ?? false,
    });
    localStorage.setItem(this.storageKey, JSON.stringify(stored));
  }

  drain() {
    if (this.draining) return;
    const queue = this.loadQueue();
    if (!queue.length) return;
    this.draining = true;
    this.processNext(queue);
  }

  private processNext(queue: QueuedRequest[]) {
    if (!queue.length) {
      this.saveQueue(queue);
      this.notifications.show({
        type: 'info',
        title: 'Back online',
        message: 'Queued changes synced.',
        icon: '✅',
      });
      this.draining = false;
      return;
    }

    const next = queue[0];
    const headers = new HttpHeaders({ ...next.headers, 'X-Offline-Replay': '1' });
    const replayReq = new HttpRequest(next.method, next.url, next.body, {
      headers,
      withCredentials: next.withCredentials,
    });

    this.http.request(replayReq).subscribe({
      next: () => {
        queue.shift();
        this.saveQueue(queue);
        this.processNext(queue);
      },
      error: () => {
        // stop draining; will retry on next online event
        this.saveQueue(queue);
        this.notifications.show({
          type: 'error',
          title: 'Sync paused',
          message: 'We will retry queued changes when connection is stable.',
          icon: '⚠️',
        });
        this.draining = false;
      },
    });
  }

  private loadQueue(): QueuedRequest[] {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch {
      return [];
    }
  }

  private saveQueue(queue: QueuedRequest[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(queue));
  }
}
