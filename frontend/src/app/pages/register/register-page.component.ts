import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent {
  name = '';
  email = '';
  password = '';
  message = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    this.message = '';
    this.auth.register({ email: this.email, password: this.password }).subscribe({
      next: () => {
        // Auto-login after successful registration
        this.auth.login({ email: this.email, password: this.password }).subscribe({
          next: () => this.router.navigate(['/mood']),
          error: () => this.router.navigate(['/login'])
        });
      },
      error: (err) => {
        this.error = this.extractError(err) || 'Registration failed';
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
