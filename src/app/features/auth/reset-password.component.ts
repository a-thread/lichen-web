import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../core/auth.service";

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="auth-card">
      <h2>Set new password</h2>
      <p class="subtitle">Choose a new password for your account.</p>

      @if (errorMessage()) {
        <div class="banner error">{{ errorMessage() }}</div>
      }

      <label>
        New password
        <input
          type="password"
          [ngModel]="password()"
          (ngModelChange)="password.set($event)"
          [class.invalid]="password() && !isPasswordValid()"
        />
        @if (password() && !isPasswordValid()) {
          <span class="field-error"
            >Password must be at least 6 characters</span
          >
        }
      </label>

      <label>
        Confirm password
        <input
          type="password"
          [ngModel]="confirmPassword()"
          (ngModelChange)="confirmPassword.set($event)"
          (keyup.enter)="submit()"
          [class.invalid]="confirmPassword() && !passwordsMatch()"
        />
        @if (confirmPassword() && !passwordsMatch()) {
          <span class="field-error">Passwords do not match</span>
        }
      </label>

      <button (click)="submit()" [disabled]="!canSubmit() || loading()">
        {{ loading() ? "Updating…" : "Update password" }}
      </button>
    </div>
  `,
  styleUrls: ["./auth.shared.scss"],
})
export class ResetPasswordComponent {
  password = signal("");
  confirmPassword = signal("");
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  isPasswordValid(): boolean {
    return this.password().length >= 6;
  }
  passwordsMatch(): boolean {
    return this.password() === this.confirmPassword();
  }
  canSubmit(): boolean {
    return this.isPasswordValid() && this.passwordsMatch();
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await this.auth.updatePassword(this.password());
      this.router.navigate(["/"]);
    } catch (err: any) {
      this.errorMessage.set(
        err?.message ?? "Unable to update password. Please try again.",
      );
    } finally {
      this.loading.set(false);
    }
  }
}
