import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Router } from "@angular/router";
import { AuthService, isValidEmail } from "../../core/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <h2>lichen</h2>
      <p class="subtitle">Ideas, resilient by design.</p>

      @if (errorMessage()) {
        <div class="banner error">{{ errorMessage() }}</div>
      }
      @if (infoMessage()) {
        <div class="banner info">{{ infoMessage() }}</div>
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
          (keyup.enter)="signIn()"
        />
      </label>

      <button (click)="signIn()" [disabled]="!canSubmit() || loading()">
        {{ loading() ? "Signing in…" : "Sign in" }}
      </button>

      <div class="links">
        <a routerLink="/forgot-password">Forgot password?</a>
        <a routerLink="/signup">Create an account</a>
      </div>
    </div>
  `,
  styleUrls: ["./auth.shared.scss"],
})
export class LoginComponent {
  email = signal("");
  password = signal("");
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  infoMessage = signal<string | null>(null);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  isEmailValid(): boolean {
    return isValidEmail(this.email());
  }

  canSubmit(): boolean {
    return this.isEmailValid() && this.password().length >= 6;
  }

  async signIn(): Promise<void> {
    if (!this.canSubmit()) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await this.auth.signIn(this.email(), this.password());
      this.router.navigate(["/"]);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? "Incorrect email or password");
    } finally {
      this.loading.set(false);
    }
  }
}
