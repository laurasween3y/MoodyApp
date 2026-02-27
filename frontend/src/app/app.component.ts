import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { AuthService } from './services/auth.service';
import { ToastComponent } from './shared/toast.component';
import { BrowserNotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  loggedIn$: Observable<boolean>;
  showMobileMenu = false;
  isOnline = navigator.onLine;

  constructor(
    private auth: AuthService,
    private router: Router,
    private browserNotifications: BrowserNotificationService
  ) {
    this.loggedIn$ = this.auth.isLoggedIn$();
    this.loggedIn$.subscribe((loggedIn) => {
      if (loggedIn) {
        this.loadNotificationSettings();
      } else {
        this.browserNotifications.clearAll();
      }
    });
  }

  @HostListener('window:online')
  handleOnline() {
    this.isOnline = true;
  }

  @HostListener('window:offline')
  handleOffline() {
    this.isOnline = false;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private async loadNotificationSettings() {
    try {
      const settings = await firstValueFrom(this.browserNotifications.getNotificationSettings());
      this.browserNotifications.applySettings(settings);
    } catch {
      /* ignore */
    }
  }

  toggleMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }
}
