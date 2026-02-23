import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

  constructor(private auth: AuthService, private router: Router) {
    this.loggedIn$ = this.auth.isLoggedIn$();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }
}
