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
  private readonly dbName = 'moody_offline_queue';
  private readonly storeName = 'kv';
  private readonly queueKey = 'queue';
  private draining = false;
  private queue: QueuedRequest[] = [];
  private initPromise: Promise<void>;
  private dbPromise?: Promise<IDBDatabase>;

  constructor(private http: HttpClient, private notifications: NotificationService) {
    this.initPromise = this.init();
    window.addEventListener('online', () => this.drain());
  }

  enqueue(req: HttpRequest<any>) {
    const headers: Record<string, string> = {};
    req.headers.keys().forEach((k) => {
      headers[k] = req.headers.get(k) ?? '';
    });

    // Store minimal request info for replay (including credentials for cookie auth).
    this.queue.push({
      url: req.url,
      method: req.method,
      body: req.body,
      headers,
      withCredentials: req.withCredentials ?? false,
    });
    void this.saveQueue(this.queue);
  }

  drain() {
    if (this.draining) return;
    // Only one drain at a time to avoid duplicate replays.
    void this.initPromise.then(() => {
      if (!this.queue.length) return;
      this.draining = true;
      this.processNext(this.queue);
    });
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
        void this.saveQueue(queue);
        this.processNext(queue);
      },
      error: () => {
        // Stop on error; we'll retry when the app comes back online.
        // stop draining; will retry on next online event
        void this.saveQueue(queue);
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

  private async init(): Promise<void> {
    const stored = await this.loadQueue();
    if (this.queue.length) {
      // Preserve any requests queued before init finishes.
      this.queue = [...stored, ...this.queue];
    } else {
      this.queue = stored;
    }
    await this.saveQueue(this.queue);
  }

  private async loadQueue(): Promise<QueuedRequest[]> {
    if (typeof indexedDB === 'undefined') {
      // Some browsers (or private mode) block IndexedDB; fall back to localStorage.
      return this.loadQueueFromLocalStorage();
    }
    try {
      const db = await this.getDb();
      return await new Promise((resolve) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(this.queueKey);
        req.onsuccess = () => resolve((req.result?.value as QueuedRequest[]) || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      // IndexedDB can fail at runtime; localStorage is a simpler fallback.
      return this.loadQueueFromLocalStorage();
    }
  }

  private async saveQueue(queue: QueuedRequest[]) {
    if (typeof indexedDB === 'undefined') {
      this.saveQueueToLocalStorage(queue);
      return;
    }
    try {
      const db = await this.getDb();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.put({ key: this.queueKey, value: queue });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // If IndexedDB write fails, at least keep a localStorage copy.
      this.saveQueueToLocalStorage(queue);
    }
  }

  private async getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }

  private loadQueueFromLocalStorage(): QueuedRequest[] {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch {
      return [];
    }
  }

  private saveQueueToLocalStorage(queue: QueuedRequest[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(queue));
  }
}
