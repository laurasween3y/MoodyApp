import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  submitting = false;
  showPassword = false;
  message = '';
  error = '';

  constructor(private auth: AuthService, private router: Router, private fb: FormBuilder) {}

  submit() {
    this.error = '';
    this.message = '';
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
    this.auth.register(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.message = 'Account created. Please sign in to continue.';
        setTimeout(() => this.router.navigate(['/login']), 900);
      },
      error: (err) => {
        this.submitting = false;
        this.error = this.extractError(err) || "We couldn't create that account. Let's try again.";
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
      if (message.toLowerCase().includes('already') && message.toLowerCase().includes('email')) {
        return 'That email is already in use. Try logging in instead.';
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
