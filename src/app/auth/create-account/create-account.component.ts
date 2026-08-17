import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthStore } from "../../data-access/auth/auth.store";
import { isValidEmail } from "../../data-access/auth/auth.service";

@Component({
  selector: "app-create-account",
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: "./create-account.component.html",
  styleUrl: "../auth.shared.scss",
})
export class CreateAccountComponent {
  email = signal("");
  password = signal("");
  confirmPassword = signal("");
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

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
