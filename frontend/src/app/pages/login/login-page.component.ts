import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  submitting = false;
  showPassword = false;
  error = '';

  constructor(private auth: AuthService, private router: Router, private fb: FormBuilder) {}

  submit() {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = "Let's check those details and try again.";
      return;
    }
    this.submitting = true;
    const payload = {
      email: this.form.value.email ?? '',
      password: this.form.value.password ?? ''
    };
    this.auth.login(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/mood']);
      },
      error: (err) => {
        this.submitting = false;
        this.error = this.extractError(err) || "Let's try that again.";
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  get emailCtrl() {
    return this.form.get('email');
  }

  get passwordCtrl() {
    return this.form.get('password');
  }

  private extractError(err: any): string | undefined {
    if (err?.error?.message) {
      const message = String(err.error.message);
      if (message.toLowerCase().includes('invalid credentials')) {
        return "Let's try that again.";
      }
      return message;
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
