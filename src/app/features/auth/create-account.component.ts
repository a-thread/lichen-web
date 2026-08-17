import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService, isValidEmail } from "../../core/auth.service";

@Component({
  selector: "app-create-account",
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <h2>Let's get started</h2>
      <p class="subtitle">Fill in your email and create your free account.</p>

      @if (errorMessage()) {
        <div class="banner error">{{ errorMessage() }}</div>
      }

      <label>
        Email address
        <input
          type="email"
          [ngModel]="email()"
          (ngModelChange)="email.set($event)"
          [class.invalid]="email() && !isEmailValid()"
        />
      </label>

      <label>
        Password
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
          (keyup.enter)="signUp()"
          [class.invalid]="confirmPassword() && !passwordsMatch()"
        />
        @if (confirmPassword() && !passwordsMatch()) {
          <span class="field-error">Passwords do not match</span>
        }
      </label>

      <button (click)="signUp()" [disabled]="!canSubmit() || loading()">
        {{ loading() ? "Creating account…" : "Create account" }}
      </button>

      <div class="links">
        <a routerLink="/login">Back to sign in</a>
      </div>
    </div>
  `,
  styleUrls: ["./auth.shared.scss"],
})
export class CreateAccountComponent {
  email = signal("");
  password = signal("");
  confirmPassword = signal("");
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  isEmailValid(): boolean {
    return isValidEmail(this.email());
  }
  isPasswordValid(): boolean {
    return this.password().length >= 6;
  }
  passwordsMatch(): boolean {
    return this.password() === this.confirmPassword();
  }
  canSubmit(): boolean {
    return (
      this.isEmailValid() && this.isPasswordValid() && this.passwordsMatch()
    );
  }

  async signUp(): Promise<void> {
    if (!this.canSubmit()) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await this.auth.signUp(this.email(), this.password());
      this.router.navigate(["/login"], {
        state: { infoMessage: "Check your email to confirm your account." },
      });
    } catch (err: any) {
      this.errorMessage.set(
        err?.message ?? "Unable to create account. Please try again.",
      );
    } finally {
      this.loading.set(false);
    }
  }
}
