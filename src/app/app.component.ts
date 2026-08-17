import { Component, effect } from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { NotesService } from "./core/notes.service";
import { AuthService } from "./core/auth.service";
import { ThemeService } from "./core/theme.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (auth.userId()) {
      <header>
        <h1>lichen</h1>
        <div class="header-actions">
          <span class="status">{{
            notesService.isOnline()
              ? "Online"
              : "Offline — changes saved locally"
          }}</span>
          <button
            type="button"
            class="icon-btn"
            (click)="theme.toggle()"
            [title]="
              theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'
            "
          >
            {{ theme.isDark() ? "☀️" : "🌙" }}
          </button>
          <button type="button" class="secondary" (click)="signOut()">
            Sign out
          </button>
        </div>
      </header>
    }
    <router-outlet />
  `,
  styles: [
    `
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        background: var(--color-surface);
        border-bottom: 1px solid var(--color-outline);
      }
      h1 {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 500;
        color: var(--color-accent);
        letter-spacing: 0.02em;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .status {
        font-size: 0.8rem;
        color: var(--color-on-surface-variant);
      }
      .icon-btn {
        background: transparent;
        border: 1px solid var(--color-outline);
        color: var(--color-text);
        padding: 0.35rem 0.55rem;
        line-height: 1;
      }
      button.secondary {
        background: transparent;
        color: var(--color-text);
        border: 1px solid var(--color-outline);
      }
    `,
  ],
})
export class AppComponent {
  constructor(
    public notesService: NotesService,
    public auth: AuthService,
    public theme: ThemeService,
    router: Router,
  ) {
    effect(() => {
      if (this.auth.passwordRecoveryPending()) {
        router.navigate(["/reset-password"]);
      }
    });
  }

  signOut(): void {
    this.auth.signOut();
  }
}
