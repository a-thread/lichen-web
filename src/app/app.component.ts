import { Component, effect } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NotesService } from './core/notes.service';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(
    public notesService: NotesService,
    public auth: AuthService,
    public theme: ThemeService,
    router: Router
  ) {
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
