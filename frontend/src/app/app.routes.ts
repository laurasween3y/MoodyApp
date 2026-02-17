import { Routes } from '@angular/router';
import { HabitsPageComponent } from './pages/habits/habits-page.component';
import { HomePageComponent } from './pages/home/home-page.component';
import { JournalPageComponent } from './pages/journal/journal-page.component';
import { EntryDetailComponent } from './pages/journal/entry-detail.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { MoodPageComponent } from './pages/mood/mood-page.component';
import { PlannerPageComponent } from './pages/planner/planner-page.component';
import { RegisterPageComponent } from './pages/register/register-page.component';
import { authGuard } from './auth.guard';
import { ProfilePageComponent } from './pages/profile/profile-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomePageComponent, title: 'Home', canActivate: [authGuard] },
  { path: 'mood', component: MoodPageComponent, title: 'Mood', canActivate: [authGuard] },
  { path: 'journal', component: JournalPageComponent, title: 'Journal', canActivate: [authGuard] },
  { path: 'journal/:journalId', component: JournalPageComponent, title: 'Journal', canActivate: [authGuard] },
  { path: 'journal/:journalId/entries/new', component: EntryDetailComponent, title: 'New Entry', canActivate: [authGuard] },
  { path: 'journal/:journalId/entries/:entryId', component: EntryDetailComponent, title: 'Entry', canActivate: [authGuard] },
  { path: 'planner', component: PlannerPageComponent, title: 'Planner', canActivate: [authGuard] },
  { path: 'habits', component: HabitsPageComponent, title: 'Habits', canActivate: [authGuard] },
  { path: 'profile', component: ProfilePageComponent, title: 'Profile', canActivate: [authGuard] },
  { path: 'login', component: LoginPageComponent, title: 'Login' },
  { path: 'register', component: RegisterPageComponent, title: 'Register' },
  { path: '**', redirectTo: 'mood' },
];
