import { computed, effect } from "@angular/core";
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from "@ngrx/signals";

const STORAGE_KEY = "lichen-theme";

export type ThemePreference = "system" | "light" | "dark";

const ORDER: ThemePreference[] = ["system", "light", "dark"];

function getInitialPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "system" || stored === "light" || stored === "dark") return stored;
  return "system";
}

type ThemeState = {
  preference: ThemePreference;
  systemPrefersDark: boolean;
};

export const ThemeStore = signalStore(
  { providedIn: "root" },
  withState<ThemeState>({
    preference: getInitialPreference(),
    systemPrefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  }),
  withComputed(({ preference, systemPrefersDark }) => ({
    isDark: computed(() =>
      preference() === "system" ? systemPrefersDark() : preference() === "dark",
    ),
  })),
  withMethods((store) => ({
    /** Cycles System -> Light -> Dark -> System. */
    cycle(): void {
      const next = ORDER[(ORDER.indexOf(store.preference()) + 1) % ORDER.length];
      patchState(store, { preference: next });
    },
  })),
  withHooks({
    onInit(store) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) =>
          patchState(store, { systemPrefersDark: e.matches }),
        );

      effect(() => {
        document.documentElement.classList.toggle("dark", store.isDark());
        localStorage.setItem(STORAGE_KEY, store.preference());
      });
    },
  }),
);
