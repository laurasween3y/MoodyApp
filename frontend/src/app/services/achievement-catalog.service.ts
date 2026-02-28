import { Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay } from 'rxjs';

import { ProgressService } from '../api';
import { AppNotification } from '../core/notification.service';

type AchievementMeta = {
  key: string;
  title: string;
  description: string;
  icon?: string | null;
};

@Injectable({ providedIn: 'root' })
export class AchievementCatalogService {
  private metaMap: Record<string, AchievementMeta> = {};
  private load$?: Observable<Record<string, AchievementMeta>>;

  constructor(private progressApi: ProgressService) {}

  ensureLoaded(): Observable<Record<string, AchievementMeta>> {
    if (Object.keys(this.metaMap).length > 0) {
      return of(this.metaMap);
    }
    if (this.load$) {
      return this.load$;
    }
    this.load$ = this.progressApi.progressAchievementsGet().pipe(
      map((res) => {
        const next: Record<string, AchievementMeta> = {};
        (res?.all_possible ?? []).forEach((ach) => {
          if (!ach?.key) return;
          next[ach.key] = {
            key: ach.key,
            title: ach.title ?? 'New badge unlocked',
            description: ach.description ?? 'A new achievement just landed.',
            icon: ach.icon ?? undefined,
          };
        });
        this.metaMap = next;
        return next;
      }),
      catchError(() => of(this.metaMap)),
      finalize(() => {
        this.load$ = undefined;
      }),
      shareReplay(1)
    );
    return this.load$;
  }

  buildToast(key: string): AppNotification {
    const meta = this.metaMap[key];
    if (!meta) {
      return {
        type: 'achievement',
        title: 'New badge unlocked',
        message: 'A new achievement just landed.',
        icon: '🏆',
      };
    }
    return {
      type: 'achievement',
      title: meta.title,
      message: meta.description,
      iconUrl: meta.icon || undefined,
      icon: meta.icon ? undefined : '🏆',
    };
  }
}
