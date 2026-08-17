import { Injectable, signal } from '@angular/core';

export interface ToastAction {
  label: string;
  onAction: () => void;
}

export interface ToastState {
  id: number;
  message: string;
  action?: ToastAction;
}

/** Single-slot toast queue. Mirrors the app's one-snackbar-at-a-time SnackbarHostState usage. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly current = signal<ToastState | null>(null);

  private nextId = 1;
  private timer?: ReturnType<typeof setTimeout>;

  show(message: string, options?: { actionLabel?: string; onAction?: () => void; duration?: number }): void {
    clearTimeout(this.timer);

    const id = this.nextId++;
    const action =
      options?.actionLabel && options.onAction
        ? { label: options.actionLabel, onAction: options.onAction }
        : undefined;

    this.current.set({ id, message, action });

    const duration = options?.duration ?? (action ? 8000 : 3000);
    this.timer = setTimeout(() => {
      if (this.current()?.id === id) this.current.set(null);
    }, duration);
  }

  runAction(): void {
    const toast = this.current();
    if (!toast?.action) return;
    toast.action.onAction();
    this.dismiss();
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.current.set(null);
  }
}
