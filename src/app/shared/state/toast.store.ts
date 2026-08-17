import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";

export interface ToastAction {
  label: string;
  onAction: () => void;
}

export interface ToastState {
  id: number;
  message: string;
  action?: ToastAction;
}

type State = { current: ToastState | null };

/** Single-slot toast queue. Mirrors the app's one-snackbar-at-a-time SnackbarHostState usage. */
export const ToastStore = signalStore(
  { providedIn: "root" },
  withState<State>({ current: null }),
  withMethods((store) => {
    let nextId = 1;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function dismiss(): void {
      clearTimeout(timer);
      patchState(store, { current: null });
    }

    return {
      show(
        message: string,
        options?: { actionLabel?: string; onAction?: () => void; duration?: number },
      ): void {
        clearTimeout(timer);

        const id = nextId++;
        const action =
          options?.actionLabel && options.onAction
            ? { label: options.actionLabel, onAction: options.onAction }
            : undefined;

        patchState(store, { current: { id, message, action } });

        const duration = options?.duration ?? (action ? 8000 : 3000);
        timer = setTimeout(() => {
          if (store.current()?.id === id) patchState(store, { current: null });
        }, duration);
      },

      runAction(): void {
        const toast = store.current();
        if (!toast?.action) return;
        toast.action.onAction();
        dismiss();
      },

      dismiss,
    };
  }),
);
