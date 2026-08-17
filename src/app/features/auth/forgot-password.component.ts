import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, isValidEmail } from '../../core/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <h2>Forgot your password?</h2>
      <p class="subtitle">
        Enter the email address associated with your account and we'll send you instructions for
        resetting your password.
      </p>

      @if (errorMessage()) {
        <div class="banner error">{{ errorMessage() }}</div>
      }
      @if (sent()) {
        <div class="banner info">Check your email for a password reset link.</div>
      }

      <label>
        Email address
        <input type="email" [(ngModel)]="email" (keyup.enter)="send()"
               [class.invalid]="email() && !isEmailValid()" />
      </label>

      <button (click)="send()" [disabled]="!isEmailValid() || loading()">
        {{ loading() ? 'Sending\u2026' : 'Reset password' }}
      </button>

      <div class="links">
        <a routerLink="/login">Back to sign in</a>
      </div>
    </div>
  `,
  styleUrls: ['../auth.shared.scss'],
})
export class ForgotPasswordComponent {
  email = signal('');
  loading = signal(false);
  sent = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(private auth: AuthService) {}

  isEmailValid(): boolean {
    return isValidEmail(this.email());
  }

  async send(): Promise<void> {
    if (!this.isEmailValid()) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await this.auth.sendPasswordReset(this.email());
      this.sent.set(true);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Unable to send reset email. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
