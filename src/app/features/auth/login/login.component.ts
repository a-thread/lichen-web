import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Router } from "@angular/router";
import { AuthService, isValidEmail } from "../../../core/auth.service";

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
