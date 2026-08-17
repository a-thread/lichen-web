import { Injectable, computed, effect, signal } from '@angular/core';

const STORAGE_KEY = 'lichen-theme';

export type ThemePreference = 'system' | 'light' | 'dark';

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly preference = signal<ThemePreference>(this.getInitialPreference());
  private readonly systemPrefersDark = signal(
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  readonly isDark = computed(() => {
    const pref = this.preference();
    return pref === 'system' ? this.systemPrefersDark() : pref === 'dark';
  });

  constructor() {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => this.systemPrefersDark.set(e.matches));

    effect(() => {
      document.documentElement.classList.toggle('dark', this.isDark());
      localStorage.setItem(STORAGE_KEY, this.preference());
    });
  }

  /** Cycles System -> Light -> Dark -> System. */
  cycle(): void {
    const next = ORDER[(ORDER.indexOf(this.preference()) + 1) % ORDER.length];
    this.preference.set(next);
  }

  private getInitialPreference(): ThemePreference {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'system' || stored === 'light' || stored === 'dark') return stored;
    return 'system';
  }
}
