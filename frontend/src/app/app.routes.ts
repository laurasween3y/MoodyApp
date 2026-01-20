import { Routes } from '@angular/router';
import { HabitsPageComponent } from './pages/habits/habits-page.component';
import { HomePageComponent } from './pages/home/home-page.component';
import { JournalPageComponent } from './pages/journal/journal-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { MoodPageComponent } from './pages/mood/mood-page.component';
import { PlannerPageComponent } from './pages/planner/planner-page.component';
import { RegisterPageComponent } from './pages/register/register-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'mood' },
  { path: 'home', component: HomePageComponent, title: 'Home' },
  { path: 'mood', component: MoodPageComponent, title: 'Mood' },
  { path: 'journal', component: JournalPageComponent, title: 'Journal' },
  { path: 'planner', component: PlannerPageComponent, title: 'Planner' },
  { path: 'habits', component: HabitsPageComponent, title: 'Habits' },
  { path: 'login', component: LoginPageComponent, title: 'Login' },
  { path: 'register', component: RegisterPageComponent, title: 'Register' },
  { path: '**', redirectTo: 'mood' },
];
