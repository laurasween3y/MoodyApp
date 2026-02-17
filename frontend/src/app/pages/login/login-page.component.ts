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
    if (!this.email.trim() || !this.password) {
      this.error = 'Please enter your email and password.';
      return;
    }
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
    const fieldErrors = err?.error?.errors?.json || err?.error?.messages?.json;
    if (fieldErrors) {
      const firstField = Object.keys(fieldErrors)[0];
      const firstMessage = fieldErrors[firstField]?.[0];
      if (firstMessage) return `${firstField}: ${firstMessage}`;
    }
    return undefined;
  }
}
