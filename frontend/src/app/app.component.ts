import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth.service';
import { ToastComponent } from './shared/toast.component';

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

  constructor(private auth: AuthService, private router: Router) {
    this.loggedIn$ = this.auth.isLoggedIn$();
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

  toggleMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }
}
