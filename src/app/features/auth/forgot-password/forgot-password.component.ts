import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthService, isValidEmail } from "../../../core/auth.service";

@Component({
  selector: "app-forgot-password",
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: "./forgot-password.component.html",
  styleUrl: "../auth.shared.scss",
})
export class ForgotPasswordComponent {
  email = signal("");
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
      this.errorMessage.set(
        err?.message ?? "Unable to send reset email. Please try again.",
      );
    } finally {
      this.loading.set(false);
    }
  }
}
