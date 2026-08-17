import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthStore } from "../../data-access/auth/auth.store";

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./reset-password.component.html",
  styleUrl: "../auth.shared.scss",
})
export class ResetPasswordComponent {
  password = signal("");
  confirmPassword = signal("");
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

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
