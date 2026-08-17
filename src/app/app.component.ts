import { Component, effect } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NotesService } from './core/notes.service';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (auth.userId()) {
      <header>
        <h1>Lichen</h1>
        <div>
          <span class="status">{{ notesService.isOnline() ? 'Online' : 'Offline \u2014 changes saved locally' }}</span>
          <button (click)="signOut()">Sign out</button>
        </div>
      </header>
    }
    <router-outlet />
  `,
  styles: [
    `header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; }
     .status { font-size: 0.85rem; opacity: 0.7; margin-right: 1rem; }`,
  ],
})
export class AppComponent {
  constructor(public notesService: NotesService, public auth: AuthService, router: Router) {
    effect(() => {
      if (this.auth.passwordRecoveryPending()) {
        router.navigate(['/reset-password']);
      }
    });
  }

  signOut(): void {
    this.auth.signOut();
  }
}
