import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthStore } from "../../data-access/auth/auth.store";
import { isValidEmail } from "../../data-access/auth/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: "./login.component.html",
  styleUrl: "../auth.shared.scss",
})
export class LoginComponent {
  email = signal("");
  password = signal("");
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  infoMessage = signal<string | null>(null);

  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

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
