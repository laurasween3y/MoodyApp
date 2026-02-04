import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/mood']),
      error: (err) => {
        this.error = this.extractError(err) || 'Login failed';
      }
    });
  }

  private extractError(err: any): string | undefined {
    if (err?.error?.message) {
      return err.error.message;
    }
    const messages = err?.error?.messages?.json;
    if (messages) {
      const firstField = Object.keys(messages)[0];
      const firstMessage = messages[firstField]?.[0];
      if (firstMessage) return `${firstField}: ${firstMessage}`;
    }
    return undefined;
  }
}
