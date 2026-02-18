import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AchievementItem as ApiAchievementItem,
  AchievementsResponse as ApiAchievementsResponse,
  Profile as ApiProfile,
  ProfileService as ProfileApiService,
  ProfileUpdate,
  ProgressService,
  StreakSummary as ApiStreakSummary,
} from '../api';

export type Profile = ApiProfile;
export type StreakSummary = ApiStreakSummary;
export type AchievementItem = ApiAchievementItem;
export type AchievementsResponse = ApiAchievementsResponse;

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(
    private profileApi: ProfileApiService,
    private progressApi: ProgressService
  ) {}

  getProfile(): Observable<Profile> {
    return this.profileApi.profileGet();
  }

  updateProfile(payload: ProfileUpdate): Observable<Profile> {
    return this.profileApi.profilePut(payload);
  }

  getStreaks(): Observable<StreakSummary> {
    return this.progressApi.progressStreaksGet();
  }

  getAchievements(): Observable<AchievementsResponse> {
    return this.progressApi.progressAchievementsGet();
  }
}
