import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ProfileService, Profile, StreakSummary, AchievementItem } from '../../services/profile.service';
import { getAchievementIcon } from '../../utils/achievement-utils';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit {
  loading = false;
  saving = false;
  error?: string;

  profile?: Profile;
  streaks?: StreakSummary;
  achievementsAll: AchievementItem[] = [];

  form = this.fb.group({
    email: [''],
    password: [''],
  });

  constructor(private fb: FormBuilder, private profileService: ProfileService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  get displayName() {
    if (!this.profile) return 'Your profile';
    const { email } = this.profile;
    return email;
  }

  async loadAll() {
    this.loading = true;
    this.error = undefined;
    try {
      const [profile, streaks, achievements] = await Promise.all([
        firstValueFrom(this.profileService.getProfile()),
        firstValueFrom(this.profileService.getStreaks()),
        firstValueFrom(this.profileService.getAchievements()),
      ]);

      this.profile = profile;
      this.streaks = streaks;
      this.achievementsAll = achievements.all_possible.map((ach) => ({
        ...ach,
        icon: getAchievementIcon(ach.key) ?? ach.icon,
      }));

      this.form.patchValue({
        email: profile.email || '',
        password: '',
      });
    } catch (err) {
      console.error(err);
      this.error = 'Unable to load your profile right now.';
    } finally {
      this.loading = false;
    }
  }

  async save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error = undefined;
    try {
  const { email, password } = this.form.value;
  const payload: any = { email };
  if (password) payload.password = password;
      const updated = await firstValueFrom(this.profileService.updateProfile(payload));
      this.profile = updated;
    } catch (err) {
      console.error(err);
      this.error = 'Unable to save changes right now.';
    } finally {
      this.saving = false;
    }
  }
}
